import React, { useCallback, useState } from 'react';
import { B2 } from '@ids-ts/typography';
import { Settings } from '@design-systems/icons';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  CardContainer,
  CardHeader,
  IconCircle,
  InnerCardContainer,
} from '../base.styles';

interface Employee {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

interface EmployeeSectionProps {
  selectedEmployees: Employee[];
  setSelectedEmployees: (employeeNames: string[]) => void;
  employees: Employee[];
}

const EmployeeSection: React.FC<EmployeeSectionProps> = ({
  selectedEmployees,
  setSelectedEmployees,
  employees,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleEmployeeChange = useCallback(
    (e: any) => {
      const value = (e.target as HTMLInputElement)?.value;
      const selectedEmployee = employees.find((emp) => emp.id === value);

      if (selectedEmployee) {
        const isAlreadySelected = selectedEmployees.some(
          (emp) => emp.id === selectedEmployee.id,
        );
        if (isAlreadySelected) {
          // Remove if already selected
          const updatedEmployees = selectedEmployees.filter(
            (emp) => emp.id !== selectedEmployee.id,
          );
          setSelectedEmployees(updatedEmployees.map((emp) => emp.name));
        } else {
          // Add if not selected
          const updatedEmployees = [...selectedEmployees, selectedEmployee];
          setSelectedEmployees(updatedEmployees.map((emp) => emp.name));
        }
      }
    },
    [selectedEmployees, setSelectedEmployees, employees],
  );

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  return (
    <CardContainer>
      <InnerCardContainer>
        <CardHeader>
          <IconCircle>
            <Settings size="small" color="white" />
          </IconCircle>
          <B2 weight="demi" style={{ color: '#000' }}>
            Employee
          </B2>
        </CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <DropdownTypeahead
            value=""
            inputValue={inputValue}
            onChange={handleEmployeeChange}
            label=""
            placeholder="Select employees"
            width="100%"
            dataSource={employeeOptions}
            renderItem={(item, index) => (
              <MenuItem key={index} value={item.value}>
                {item.label}
              </MenuItem>
            )}
          />
          {selectedEmployees.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selectedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {employee.name}
                  <button
                    onClick={() => {
                      const updatedEmployees = selectedEmployees.filter(
                        (emp) => emp.id !== employee.id,
                      );
                      setSelectedEmployees(
                        updatedEmployees.map((emp) => emp.name),
                      );
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1976d2',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '0',
                      marginLeft: '4px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </InnerCardContainer>
    </CardContainer>
  );
};

export default EmployeeSection;
