import React from 'react';
import { List, Typography } from '@mui/material';
import FileItem from './FileItem';

interface FileListProps {
  files: string[];
  folderName: string;
}

const FileList: React.FC<FileListProps> = ({ files, folderName }) => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Files:
      </Typography>
      <List>
        {files.map((file, index) => (
          <FileItem key={index} file={file} folderName = {folderName} />
        ))}
      </List>
    </div>
  );
};

export default FileList;
