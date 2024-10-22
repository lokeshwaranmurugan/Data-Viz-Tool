import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid'; // Grid2 now stable

interface Parameter {
  'Parameter name': string;
  Value: number;
  Range: string;
  'Default value': number;
  Description: string;
  'Code variable name': string;
}

interface PopupModalProps {
  open: boolean;
  onClose: () => void;
  parameters: Parameter[];
  onSubmit: (updatedParams: Parameter[]) => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ open, onClose, parameters, onSubmit }) => {
  const [formData, setFormData] = useState<Parameter[]>([]);
  const [errors, setErrors] = useState<boolean[]>([]);

  useEffect(() => {
    if (parameters) {
      const initialData = parameters.map(param => ({
        ...param,
        Value: param.Value || param['Default value'],
      }));
      setFormData(initialData);
      setErrors(Array(initialData.length).fill(false)); // Initialize all errors to false
    }
  }, [parameters]);

  const isValidNumber = (value: number, min: number, max: number) => {
    return value >= min && value <= max;
  };

  const handleInputChange = (index: number, value: string) => {
    const numericValue = Number(value);
    const range = formData[index].Range;

    let [min, max] = [-Infinity, Infinity]; // Default range

    if (range.includes('-->')) {
      let [val1, val2] = range.split(' --> ').map(Number);
      if (val1 < 0 && val2 < 0){
        [min, max] = [val2, val1];
      } else {
        [min, max] = [val1, val2];
      }
    } else if (range.toLowerCase() === 'any positive integer') {
      min = 0; // Allow only positive values
      max = Infinity;
    } else if (range.toLowerCase() === 'any negative integer') {
      min = -Infinity; // Allow only negative values
      max = -1;
    }

    // Update the form data
    const updatedData = [...formData];
    updatedData[index].Value = numericValue;

    const updatedErrors = [...errors];
    updatedErrors[index] = !isValidNumber(numericValue, min, max); // Check validity
    setFormData(updatedData);
    setErrors(updatedErrors);
  };

  const handleCancel = () => {
    const resetData = parameters.map(param => ({
      ...param,
      Value: param['Default value'],
    }));
    setFormData(resetData);
    onClose();
  };

  const handleSubmit = () => {
    const invalidFields = formData.some((param, index) => {
      const range = param.Range;
      let [min, max] = [-Infinity, Infinity];

      if (range.includes('-->')) {
        let [val1, val2] = range.split(' --> ').map(Number);
        if (val1 < 0 && val2 < 0){
            [min, max] = [val2, val1];
        } else {
            [min, max] = [val1, val2];
        }
      } else if (range.toLowerCase() === 'any positive integer') {
        min = 0;
      } else if (range.toLowerCase() === 'any negative integer') {
        max = -1;
      }

      return !isValidNumber(param.Value, min, max);
    });

    if (invalidFields) {
      alert('Please fix the errors before submitting.');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      sx={{
        '& .MuiDialog-paper': {
          width: '50%',  // Width of 60% of the window
          height: '70%', // Height of 60% of the window
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          backgroundColor: 'primary.main', // Primary background color
          color: 'white', // White text
        }}
      >
        Parameter Settings
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Grid container spacing={3}>
          {formData.map((param, index) => (
            <Grid item xs={6} key={param['Code variable name']}>
              <Box mb={3} ml={2} mt={0}>
                <Typography
                  variant="body1" 
                  gutterBottom 
                  sx={{ fontWeight: 'bold', fontSize: '1.1rem' }} // Bold and larger font size
                >
                  {param['Parameter name']}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={param.Value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  error={errors[index]}  // Highlight in red if error
                  helperText={errors[index] ? `Value must be between ${param.Range}` : `Range: ${param.Range}`} // Show range in helper text
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: errors[index] ? 'red' : '', // Change border color if error
                      },
                    },
                  }}
                  variant="outlined"
                  InputProps={{
                    inputMode: 'numeric', // Allows numeric input, including negative values
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          onClick={handleCancel}
          variant="contained"
          sx={{
            backgroundColor: 'primary', // Blue outline for cancel
            color: 'white',
            '&:hover': {
              backgroundColor: 'grey',
              color: 'white',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: 'primary', // Green outline for submit
            color: 'white',
            '&:hover': {
              backgroundColor: 'green',
              color: 'white',
            },
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopupModal;
