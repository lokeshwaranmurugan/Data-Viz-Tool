
import os
import logging
import pandas as pd
from flask import Flask, request, jsonify, send_file
from io import StringIO, BytesIO
from werkzeug.utils import secure_filename
import csv
from flask_cors import CORS, cross_origin

# Initialize Flask app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Configuration
UPLOAD_FOLDER = './python-backend/uploads/'
EXPORT_FOLDER = './python-backend/output/'
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Utility function to check allowed file extensions
def allowed_file(filename):
    """
    Check if the file extension is allowed.

    Args:
        filename (str): The name of the file to check.

    Returns:
        bool: True if the file extension is allowed, False otherwise.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
@cross_origin()
def upload_file():
    """
    Handle CSV and Excel file uploads. Saves the file to the server.

    Returns:
        JSON response indicating success or failure of the upload.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            logging.info(f"File uploaded: {filename}")
            if file.filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            elif file.filename.endswith('.xlsx'):
                df = pd.read_excel(filepath)

            # Send back the data for visualization
            data = [{'sheetName':filename , 'sheetContent': df.to_dict(orient='records')}]
            return jsonify({'message': f'File uploaded successfully: {filename}','data':data}), 200
        else:
            return jsonify({'error': 'File type not allowed'}), 400

    except Exception as e:
        logging.error(f"Error during file upload: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/export', methods=['POST'])
def export_data():
    try:
        data = request.get_json()
        export_type = data.get('export_type')
        filename = 'data.' + export_type
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        if filepath.endswith('.csv'):
            with open(filepath, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=data.keys())
                writer.writeheader()
                writer.writerow(data)
            return send_file(filepath, mimetype='text/csv', as_attachment=True, attachment_filename=filename)

        else:
            return jsonify({'error': 'Unsupported file format'}), 400

    except Exception as e:
        logging.error(f"Error exporting file {filename}: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/checkExportStatus', methods=['GET'])
def check_folder():
    folder_name = request.args.get('name')
    
    if not folder_name:
        return jsonify({'error': 'Folder name is required'}), 400
    
    folder_path = os.path.join(EXPORT_FOLDER, folder_name)
    
    if not os.path.exists(folder_path):
        return jsonify({'status': 'Folder not found'}), 404
    
    # Check for the required files
    csv_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]
    excel_files = [f for f in os.listdir(folder_path) if f.endswith('.xlsx')]
    success_file = os.path.exists(os.path.join(folder_path, 'success.txt'))
    failure_file = os.path.exists(os.path.join(folder_path, 'failure.txt'))
    
    # Check if all required files are present
    if success_file:
        return jsonify({
            'status': 'success',
            'files': csv_files + excel_files
        }), 200
    elif failure_file:
        return jsonify({'status': 'File generation failed'}), 500
    else:
        return jsonify({'status': 'Report generation is still in progress'}), 200
    
@app.route('/api/viewData', methods=['GET'])
def get_file():
    folder_name = request.args.get('folderName')
    file_name = request.args.get('fileName')

    if not folder_name or not file_name:
        return jsonify({'status': 'Folder name and file name are required'}), 400

    folder_path = os.path.join(EXPORT_FOLDER, folder_name)
    file_path = os.path.join(folder_path, file_name)

    # Check if folder and file exist
    if not os.path.exists(folder_path):
        return jsonify({'status': 'Folder not found'}), 404
    if not os.path.exists(file_path):
        return jsonify({'status': 'File not found'}), 404
    # if not file_name.endswith('.csv'):
    #     return jsonify({'status': 'Provided file is not a CSV'}), 400

    # Read CSV file
    if file_name.endswith('.csv'):
        try:
            csv_data = pd.read_csv(file_path)
            json_data = [{'sheetName':file_name , 'sheetContent': csv_data.to_dict(orient='records')}]  # Convert CSV to JSON format
            return jsonify({'status':'success','data':json_data}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    elif file_name.endswith('.xlsx') or file_name.endswith('.xls'):
        try:
            excel_data = pd.read_excel(file_path, sheet_name=None)  # Load all sheets
            result = []
            for sheet_name, data in excel_data.items():
                result.append({'sheetName':sheet_name , 'sheetContent': data.to_dict(orient='records')})
            return jsonify({'status':'success','data':result}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    else:
        return jsonify({'status': 'Provided file is neither a CSV nor an Excel file'}), 400


if __name__ == '__main__':
    app.run(debug=False)
