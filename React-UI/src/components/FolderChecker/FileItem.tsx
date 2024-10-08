import React, { useContext, useState } from 'react';
import { ListItem, ListItemText, Button, ListItemSecondaryAction, Box } from '@mui/material';
import axios from 'axios';
import CustomizedDataGrid from '../DataGrid/CustomizedDataGrid';
import { DataContext } from '../../App';

interface FileItemProps {
  file: string;
  folderName: string;
}

const FileItem: React.FC<FileItemProps> = ({ file, folderName }) => {
  const [status, setStatus] = useState<string>('');
  const [fileData, setFileData] = useState([]);
  const {updateTableData} = useContext(DataContext);

  const handleExport = async (): Promise<void> => {
    alert(`Exporting ${file}`);
    // Implement actual file export logic
    
  };

  const handleView = async (): Promise<void> => {
    // alert(`Viewing ${file}`);
    // Implement actual file view logic
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/viewData', {
        params: { folderName: folderName, fileName: file  },
      });
      setStatus(response.data?.status);
      setFileData(response.data?.data);
      updateTableData(response.data?.data);

    } catch (error:any) {
      setStatus(error.response?.data?.status || 'Error occurred');
      setFileData([]);
    }
  };

  return (
    <>
    <ListItem divider>
      <ListItemText primary={file} />
      <ListItemSecondaryAction>
        <Button variant="outlined" color="primary" onClick={handleExport} style={{ marginRight: '8px' }}>
          Export
        </Button>
        <Button variant="contained" color="secondary" onClick={handleView}>
          View
        </Button>
      </ListItemSecondaryAction>
    </ListItem>
    {/* {fileData.length > 0 &&
      <Box textAlign="center" mt={1}>
        <CustomizedDataGrid fileRowData = {fileData} />
      </Box>
    } */}
    </>
  );
};

export default FileItem;
