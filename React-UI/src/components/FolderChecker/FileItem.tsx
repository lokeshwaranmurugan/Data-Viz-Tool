import React, { useContext, useState } from 'react';
import { ListItem, ListItemText, IconButton, Box, Tooltip } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp'; // For export icons
import TableViewIcon from '@mui/icons-material/TableView'; // For view icon
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
  const { updateTableData } = useContext(DataContext);

  const handleExport = async (outputFormat: string): Promise<void> => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/process-file', {
        params: {
          filename: file,
          foldername: folderName,
          format: outputFormat,
        },
        responseType: 'blob', // Important to handle file download
      });

      // Create a blob link for the file and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file.split('.')[0]}.${outputFormat}`); // Filename with the requested format
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      console.error('Error exporting file:', error);
      setStatus('Export failed');
    }
  };

  const handleView = async (): Promise<void> => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/viewData', {
        params: { folderName: folderName, fileName: file },
      });
      setStatus(response.data?.status);
      setFileData(response.data?.data);
      updateTableData(response.data?.data);
    } catch (error: any) {
      setStatus(error.response?.data?.status || 'Error occurred');
      setFileData([]);
    }
  };

  return (
    <>
      <ListItem divider>
        <ListItemText primary={file} />
        {/* Flex box to handle the new buttons */}
        <Box display="flex" alignItems="center">
          {/* Excel Export Button */}
          <Tooltip title="Export as Excel" arrow>
            <IconButton
              color="primary"
              onClick={() => handleExport('excel')}
              sx={{ borderRadius: '50%', marginRight: 1 }}
            >
              <GetAppIcon />
            </IconButton>
          </Tooltip>

          {/* CSV Export Button */}
          <Tooltip title="Export as CSV" arrow>
            <IconButton
              color="secondary"
              onClick={() => handleExport('csv')}
              sx={{ borderRadius: '50%', marginRight: 1 }}
            >
              <GetAppIcon />
            </IconButton>
          </Tooltip>

          {/* View Button */}
          <Tooltip title="View File" arrow>
            <IconButton color="info" onClick={handleView} sx={{ borderRadius: '50%' }}>
              <TableViewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>

    </>
  );
};

export default FileItem;
