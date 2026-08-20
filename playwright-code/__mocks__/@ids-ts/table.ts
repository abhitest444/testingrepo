import React from 'react';

const TableComponent = ({ children, ...props }: any) =>
  React.createElement('table', props, children);

export const Table = Object.assign(TableComponent, {
  Cell: ({ children, ...props }: any) =>
    React.createElement('td', props, children),
  Head: ({ children, ...props }: any) =>
    React.createElement('thead', props, children),
  Header: ({ children, ...props }: any) =>
    React.createElement('thead', props, children),
  HeaderCell: ({ children, ...props }: any) =>
    React.createElement('th', props, children),
  Row: ({ children, ...props }: any) =>
    React.createElement('tr', props, children),
  Body: ({ children, ...props }: any) =>
    React.createElement('tbody', props, children),
});
