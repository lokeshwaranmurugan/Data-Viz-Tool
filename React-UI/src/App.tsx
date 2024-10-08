import Box from '@mui/material/Box';
import { createContext, SyntheticEvent, useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import CustomizedDataGrid from './components/DataGrid/CustomizedDataGrid';
import FileUpload from './components/uploader/uploader';

export const DataContext = createContext({
  fileData: [],
  updateTableData: (newData: []) => {},
  updateTabName: (newName: string) => {}
});

export default function App() {
  const [fileData, setFileData] = useState([]);
  const [tabName, setTabName] = useState('');
  const [tabData, setTabData] = useState([]);

  const updateTableData = (newData: []) => {
    setFileData(newData);
  };

  const updateTabName = (newName: string) => {
    setTabName(newName);
  };

  const handleChange = (event: SyntheticEvent<Element, Event>, newValue: string) => {
    setTabName(newValue);
    if (fileData.length > 0) {
      const selectedSheet = fileData.find((sheet) => sheet['sheetName'] === newValue);
      if (selectedSheet) {
        setTabData(selectedSheet['sheetContent']);
      }
    }
  };

  useEffect(() => {
    if (fileData.length > 0) {
      setTabData(fileData[0]['sheetContent']);
      setTabName(fileData[0]['sheetName']);
    }
  }, [fileData]);

  return (
    <Box sx={{ width: '80%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <DataContext.Provider value={{ fileData, updateTableData, updateTabName }}>
        <FileUpload />
      </DataContext.Provider>

      {fileData.length > 0 && (
        <Box textAlign="center" mt={1}>
          <TabContext value={tabName}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleChange} aria-label="lab API tabs example">
                {fileData.map((dataTab, index) => (
                  <Tab
                    label={dataTab['sheetName']}
                    value={dataTab['sheetName']}
                    key={dataTab['sheetName']} // Ensure unique key
                  />
                ))}
              </TabList>
            </Box>

            {fileData.map((dataTab, index) => (
              <TabPanel value={dataTab['sheetName']} key={dataTab['sheetName']}> {/* Ensure unique key */}
                <CustomizedDataGrid fileRowData={tabData} />
              </TabPanel>
            ))}
          </TabContext>
        </Box>
      )}
    </Box>
  );
}
