import { DataGrid, GridRowsProp, GridToolbar } from '@mui/x-data-grid';

interface ColumnConfig {
  field: string;
  headerName: string;
  headerAlign: 'right';
  align: 'right';
  flex: number;
  minWidth: number;
}

// Function to generate column config objects for each sheet
const generateColumns = (keys: string[]): ColumnConfig[] => {
  return keys.map(key => ({
    field: key,
    headerName: key,
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 80
  }));
};


export default function CustomizedDataGrid({fileRowData} : any ) {

  const firstRow = fileRowData[0] || {}; // Default to an empty object if no rows
  const keys = Object.keys(firstRow);
  
  return (
    <DataGrid
      autoHeight
      checkboxSelection
      rows={fileRowData}
      columns={generateColumns(keys)}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
      slots={{ toolbar: GridToolbar }}
      pageSizeOptions={[10, 20, 50]}
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
  );
}
