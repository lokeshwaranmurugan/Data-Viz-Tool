import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
  Typography,
  linearProgressClasses,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import FolderChecker from '../FolderChecker/FolderChecker';
import { DataContext } from '../../App';
import { ButtonProps } from '@mui/material/Button';

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

const CircularUploadButton = styled(Button)<ButtonProps>(({ theme }) => ({
  borderRadius: '50%',
  width: 70,
  height: 70,
  padding: 0,
  minWidth: 0,
}));

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 0,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 0,
    backgroundColor: 'green',
    ...theme.applyStyles('dark', {
      backgroundColor: '#308fe8',
    }),
  },
}));

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState([]);
  const [folderName, setFolderName] = useState<string>('');
  const { updateTableData } = useContext(DataContext);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processStatus, setProcessStatus] = useState<'Success' | 'Error' | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', 'xlsx', '.xls'];
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
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          } else {
            setUploadProgress(null);
          }
        },
      });
      console.log('File uploaded successfully:', response.data);
      setFileData(response.data?.data);
      setFolderName(file.name.split('.')[0]);
      updateTableData(response.data?.data);

      if (response.data.message) {
        setUploadSuccess(true);
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity('success');
      } else if (response.data.error) {
        setUploadSuccess(false);
        setSnackbarMessage(response.data.error);
        setSnackbarSeverity('error');
      }

      setSnackbarOpen(true);
    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);
      setError('Error uploading file. Please try again.');
      setUploadProgress(null);
      setSnackbarMessage('Error processing file. Please try again.' + uploadError);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const startFileProcessing = async (fileName: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/trigger-file-process', { filename: fileName });
      console.log('File processing triggered:', response.data);

      setSnackbarMessage('File processing triggered: ' + response.data.message);
      setProcessStatus('Success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error triggering file process:', error);
      setSnackbarMessage('Error processing file. Please try again.');
      setSnackbarSeverity('error');
      setProcessStatus('Error');
      setSnackbarOpen(true);
    }
  };

  const handleProcess = async () => {
    if (file) {
      await startFileProcessing(file.name);
    }
  };

  useEffect(() => {
    if (file) {
      handleUpload();
    }
  }, [file]);

  const handleSnackbarClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Container maxWidth="lg">
        <Box textAlign="center" mt={2}>
          {file && <Typography variant="body1">{file.name}</Typography>}
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
          <Tooltip title="Upload File" arrow>
            <CircularUploadButton
              component="label"
              variant="contained"
              color={uploadSuccess ? 'success' : (snackbarSeverity === 'error' ? 'error' : 'primary')}
              onClick={(e) => uploadProgress !== null && e.preventDefault()}
            >
              <CloudUploadIcon fontSize="large" />
              <VisuallyHiddenInput type="file" onChange={handleFileChange} />
            </CircularUploadButton>
          </Tooltip>
          <BorderLinearProgress variant="determinate" value={uploadProgress ?? 0} sx={{ width: '20%', mx: 0 }} />
          <Tooltip title="Process File" arrow>
            <CircularUploadButton
              onClick={handleProcess}
              variant="contained"
              color={processStatus === 'Success' ? 'success' : (snackbarSeverity === 'error' ? 'error' : 'primary')}
            >
              {processStatus === 'Error' ? <CancelIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
            </CircularUploadButton>
          </Tooltip>
        </Box>

        {fileData.length > 0 && processStatus === 'Success' && (
          <FolderChecker fileName={folderName} />
        )}
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default FileUpload;
