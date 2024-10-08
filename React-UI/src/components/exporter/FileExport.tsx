import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import './App.css';

interface ApiResponse {
  status: string;
  files?: string[];
}

const FileExport = () => {
  // State types
  const [folderName, setFolderName] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);

  // Handle input change with typed event
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFolderName(e.target.value);
  };

  // Fetch the folder status and files
  const handleCheckFolder = async (): Promise<void> => {
    try {
      const response = await axios.get<ApiResponse>('http://localhost:5000/api/checkExportStatus', {
        params: { name: folderName },
      });

      setStatus(response.data.status);
      if (response.data.files) {
        setFiles(response.data.files);
      } else {
        setFiles([]);
      }
    } catch (error: any) {
      setStatus(error.response?.data?.status || 'Error occurred');
      setFiles([]);
    }
  };

  // Handle Export button
  const handleExport = (file: string): void => {
    alert(`Exporting ${file}`);
    // Implement file export logic here (e.g., download file)
  };

  // Handle View button
  const handleView = (file: string): void => {
    alert(`Viewing ${file}`);
    // Implement file viewing logic here (e.g., open file in new tab)
  };

  return (
    <div className="App">
      <h1>Folder File Checker</h1>
      <div>
        <input
          type="text"
          value={folderName}
          onChange={handleInputChange}
          placeholder="Enter folder name"
        />
        <button onClick={handleCheckFolder}>Check Folder</button>
      </div>
      <div>
        <h3>Status: {status}</h3>
        {files.length > 0 && (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file}{' '}
                <button onClick={() => handleExport(file)}>Export</button>
                <button onClick={() => handleView(file)}>View</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileExport;
