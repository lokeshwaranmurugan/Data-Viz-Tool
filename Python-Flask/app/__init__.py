
from datetime import datetime
import json
import os
import logging
import shutil
import threading
import time
import pandas as pd
from flask import Flask, request, jsonify, send_file, Response
from io import StringIO, BytesIO
from werkzeug.utils import secure_filename
import csv
from flask_cors import CORS, cross_origin
from wntd_main import main as trigger_main
# from collections import OrderedDict

# Initialize Flask app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Configuration
UPLOAD_FOLDER = './python-backend/uploads/'
EXPORT_FOLDER = './python-backend/output/'
PROCESSED_FOLDER = './python-backend/processed/'
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ensure processed folder exists
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

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
            # data = [{'sheetName':filename , 'sheetContent': df.apply(lambda row: OrderedDict(row), axis=1).to_list()}]
            # return jsonify({'message': f'File uploaded successfully: {filename}','data':data}), 200
            response_json = json.dumps(
                {'message': f'File uploaded successfully: {filename}', 'data': data},
                ensure_ascii=False,  # Optional: for proper handling of non-ASCII characters
                sort_keys=False      # Prevent sorting of keys
            )

            # Return the response with correct content type
            return Response(response=response_json, status=200, mimetype='application/json')
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
            response_json = json.dumps(
                {'status': 'success', 'data': json_data},
                ensure_ascii=False,  # Optional: for proper handling of non-ASCII characters
                sort_keys=False      # Prevent sorting of keys
            )

            # Return the response with correct content type
            return Response(response=response_json, status=200, mimetype='application/json')
            # return jsonify({'status':'success','data':json_data}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    elif file_name.endswith('.xlsx') or file_name.endswith('.xls'):
        try:
            excel_data = pd.read_excel(file_path, sheet_name=None)  # Load all sheets
            result = []
            for sheet_name, data in excel_data.items():
                result.append({'sheetName':sheet_name , 'sheetContent': data.to_dict(orient='records')})
            
            response_json = json.dumps(
                {'status': 'success', 'data': result},
                ensure_ascii=False,  # Optional: for proper handling of non-ASCII characters
                sort_keys=False      # Prevent sorting of keys
            )

            # Return the response with correct content type
            return Response(response=response_json, status=200, mimetype='application/json')
            
            # return jsonify({'status':'success','data':result}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    else:
        return jsonify({'status': 'Provided file is neither a CSV nor an Excel file'}), 400
    

@app.route('/process-file', methods=['GET'])
def process_file():
    # Get filename, foldername, and format from request parameters
    filename = request.args.get('fileName')
    foldername = request.args.get('folderName')
    output_format = request.args.get('format', 'excel')  # Default to excel if not provided

    if not filename or not foldername:
        return jsonify({'error': 'filename and foldername parameters are required'}), 400

    # Construct the file path
    file_path = os.path.join(EXPORT_FOLDER, foldername, secure_filename(filename))

    # Check if file exists
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    # Determine file extension
    file_ext = os.path.splitext(filename)[1].lower()

    try:
        output = BytesIO()
        # Handle the request based on the output format
        if output_format == 'excel':
            # If user requested Excel format
            if file_ext == '.xlsx':
                # If it's already an Excel file, send it directly
                data = pd.read_excel(file_path)
                
                data.to_excel(output, index=False)
                output.seek(0)
                return send_file(output,mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                 , as_attachment=True, download_name=filename)
            elif file_ext == '.csv':
                # If it's a CSV file, convert it to Excel
                df = pd.read_csv(file_path)
                processed_filename = f'processed_{filename.split(".")[0]}.xlsx'
                processed_file_path = os.path.join(PROCESSED_FOLDER, processed_filename)

                # Save CSV data to Excel
                df.to_excel(output, index=False)
                output.seek(0)
                # Send the processed Excel file
                return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                 as_attachment=True, download_name=processed_filename)
            else:
                return jsonify({'error': 'Unsupported file type for Excel conversion'}), 400
        
        elif output_format == 'csv':
            # If user requested CSV format
            if file_ext == '.csv':
                # If it's already a CSV file, send it directly
                data = pd.read_csv(file_path)
                
                data.to_csv(output, index=False)
                output.seek(0)
                return send_file(output, mimetype='text/csv', as_attachment=True, download_name=filename)
            elif file_ext == '.xlsx':
                # If it's an Excel file, convert to CSV
                excel_file = pd.ExcelFile(file_path)
                # Let's assume we process only the first sheet for CSV conversion
                df = excel_file.parse(excel_file.sheet_names[0])
                processed_filename = f'processed_{filename.split(".")[0]}.csv'
                processed_file_path = os.path.join(PROCESSED_FOLDER, processed_filename)
                
                # Save Excel sheet to CSV
                df.to_csv(output, index=False)
                output.seek(0)
                # Send the processed CSV file
                return send_file(output, mimetype='text/csv', as_attachment=True, download_name=processed_filename)
            else:
                return jsonify({'error': 'Unsupported file type for CSV conversion'}), 400
        else:
            return jsonify({'error': 'Invalid format requested. Use "excel" or "csv".'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

def process_file_trigger(filename):
    try:
        # Simulate a time-consuming file processing task
        logging.info(f"Starting to process file: {filename}")
        # time.sleep(10)  # Simulate a delay
        response = trigger_main(filename,4,1);
        if response == "SUCCESS" :
            logging.info(f"File processed successfully: {filename}")
        else:
            logging.info(f"Error unable to process: {filename}")
            logging.info(response)
    except Exception as e:
        logging.error(f"Error processing file {filename}: {e}")

@app.route('/api/trigger-file-process', methods=['POST'])
def trigger_file_process():
    if not request.is_json:
        logging.warning("Request does not contain JSON")
        return jsonify({"error": "Invalid input format, expected JSON."}), 400

    data = request.json
    filename = data.get('filename')

    if not filename or not isinstance(filename, str):
        logging.warning("Invalid filename provided")
        return jsonify({"error": "Invalid or missing filename."}), 400

    # Start the file processing in a separate thread
    thread = threading.Thread(target=process_file_trigger, args=(filename,))
    thread.start()

    # Send a success response immediately
    return jsonify({"status":"Success","message": "File processing started", "filename": filename}), 202


def archive_and_move_file(upload_folder, output_folder, archived_folder, filename):
    # Construct full file path for the uploaded file
    upload_file_path = os.path.join(upload_folder, filename)

    # Check if the file exists in the uploads folder
    if os.path.isfile(upload_file_path):
        # Get the file name (without extension) and extension
        file_name, file_extension = os.path.splitext(filename)

        # Generate the new folder name with the current date and time in the archived folder
        current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
        archive_folder_name = f"{file_name}_{current_time}"
        archive_folder_path = os.path.join(archived_folder, archive_folder_name)

        # Create the new folder inside the archived folder
        os.makedirs(archive_folder_path, exist_ok=True)

        # Move the file from the uploads folder to the newly created folder in archived
        shutil.move(upload_file_path, os.path.join(archive_folder_path, filename))
        print(f"File moved to: {archive_folder_path}")

        # Check if the output folder has a folder with the same name as the uploaded file (without extension)
        output_folder_path = os.path.join(output_folder, file_name)
        if os.path.isdir(output_folder_path):
            # Create a zip file of the folder in the archived folder
            zip_file_path = os.path.join(archive_folder_path, f"{file_name}.zip")
            shutil.make_archive(zip_file_path.replace('.zip', ''), 'zip', output_folder_path)

            # Move the zip file to the archive folder
            print(f"Folder zipped and moved to: {zip_file_path}")
        else:
            print(f"No folder found in the output folder with the name '{file_name}'.")

    else:
        print(f"File '{filename}' not found in '{upload_folder}'.")


if __name__ == '__main__':
    app.run(debug=False)
