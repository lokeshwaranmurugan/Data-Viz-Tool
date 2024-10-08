import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Container, Input, InputLabel, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import CustomizedDataGrid from '../DataGrid/CustomizedDataGrid';
import FolderChecker from '../FolderChecker/FolderChecker';
import { DataContext } from '../../App';


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState([]);
  const [folderName, setFolderName] = useState<string>('');
  const {updateTableData} = useContext(DataContext);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.slice(-4);
      if (!validExtensions.includes(fileExtension)) {
        setError('Please upload a valid CSV or Excel file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('File uploaded successfully:', response.data);
      setFileData(response.data?.data);
      setFolderName(file.name.split('.')[0]);
      updateTableData(response.data?.data);

    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);
      setError('Error uploading file. Please try again.');
    }
  };

  useEffect(() => {
    if (file) {
      handleUpload();
    }
  }, [file]);

  return (
    <div >
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Container maxWidth="lg">
        <Box textAlign="center" mt={2}>
          <TextField
            label="Uploaded File"
            variant="outlined"
            fullWidth
            value={file?.name || ''}
            margin="normal"
            disabled
          />
        </Box>
        <Box textAlign="center" mt={1}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload files
            <VisuallyHiddenInput
              type="file"
              onChange={handleFileChange}
              multiple
            />
          </Button>
        </Box>
      
      

      {fileData.length > 0 &&
      <>
      {/* <Box textAlign="center" mt={1}>
        <CustomizedDataGrid fileRowData = {fileData} />
      </Box> */}
      <FolderChecker fileName = {folderName} />
      </>
      }
      </Container>
    </div>
  );
};

export default FileUpload;
