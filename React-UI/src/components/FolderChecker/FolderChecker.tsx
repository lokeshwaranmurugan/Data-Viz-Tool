import React, { useState, ChangeEvent } from 'react';
import { TextField, Button, Typography, Container, Box } from '@mui/material';
import axios from 'axios';
import FileList from './FileList';

interface ApiResponse {
  status: string;
  files?: string[];
}

const FolderChecker: React.FC<{fileName: string}> = ({fileName} : {fileName: string}) => {
//   const [folderName, setFolderName] = useState<string>(fileName);
  const [status, setStatus] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);

//   const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
//     setFolderName(e.target.value);
//   };

  const handleCheckFolder = async (): Promise<void> => {
    try {
      const response = await axios.get<ApiResponse>('http://127.0.0.1:5000/api/checkExportStatus', {
        params: { name: fileName },
      });
      setStatus(response.data.status);
      if (response.data.files) {
        setFiles(response.data.files);
      } else {
        setFiles([]);
      }
    } catch (error:any) {
      setStatus(error.response?.data?.status || 'Error occurred');
      setFiles([]);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box textAlign="center" mt={4}>
        {/* <Typography variant="h4" gutterBottom>
          Folder File Checker
        </Typography>
        <TextField
          label="Enter folder name"
          variant="outlined"
          fullWidth
          value={folderName}
          onChange={handleInputChange}
          margin="normal"
        /> */}
        <Button variant="contained" color="primary" onClick={handleCheckFolder}>
          View Processed Data
        </Button>

        <Box mt={4}>
          { status != '' && <Typography variant="h6">Status: {status}</Typography> }
        </Box>

        {files.length > 0 && <FileList folderName={fileName} files={files} />}
      </Box>
    </Container>
  );
};

export default FolderChecker;
