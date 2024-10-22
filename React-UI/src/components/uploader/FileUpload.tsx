import React, { useState } from 'react';
import PopupModal from './PopupModal';

interface Parameter {
  'Parameter name': string;
  Value: number;
  Range: string;
  'Default value': number;
  Description: string;
  'Code variable name': string;
}

const FileUploaderComp: React.FC = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([
    {
      "Parameter name": "Par 1",
      "Value": 80,
      "Range": "0 --> 100",
      "Default value": 70,
      "Description": "minimum allowed",
      "Code variable name": "par_1"
    },
    {
      "Parameter name": "Par 2",
      "Value": -90,
      "Range": "-40 --> -120",
      "Default value": -90,
      "Description": "minimum",
      "Code variable name": "par_2"
    },
    {
        "Parameter name": "Par 3",
        "Value": 80,
        "Range": "any positive integer",
        "Default value": 70,
        "Description": "minimum allowed par",
        "Code variable name": "par_3"
    },
    {
    "Parameter name": "Par 4",
    "Value": -90,
    "Range": "any negative integer",
    "Default value": -90,
    "Description": "minimum",
    "Code variable name": "par_4"
    }
  ]);

  const handleProcess = () => {
    setPopupOpen(true);
  };

  const handlePopupSubmit = (updatedParams: Parameter[]) => {
    setParameters(updatedParams);
    console.log("Updated Parameters:", updatedParams);
  };

  return (
    <div>
      <button onClick={handleProcess}>Open Parameter Settings</button>

      <PopupModal
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        parameters={parameters}
        onSubmit={handlePopupSubmit}
      />
    </div>
  );
};

export default FileUploaderComp;
