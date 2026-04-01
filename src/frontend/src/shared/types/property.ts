import { BaseSyntheticEvent } from 'react';

export interface IPropertyChange {
  handleChange: (event: BaseSyntheticEvent) => void;
  handleSubmit: (event: BaseSyntheticEvent) => void;
  buttonText: string;
}

export interface IPropertyChangeOldNew {
  handleChangeOld: (event: BaseSyntheticEvent) => void;
  handleChangeNew: (event: BaseSyntheticEvent) => void;
  handleSubmit: (event: BaseSyntheticEvent) => void;
  buttonText: string;
}
