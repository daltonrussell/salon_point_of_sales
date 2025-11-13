/**
 * Tests for ServicesSection component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServicesSection from '../ServicesSection';

const mockServices = [
  { id: 1, name: "Haircut", price: 50 },
  { id: 2, name: "Color", price: 80 },
];

const mockLuxuryServices = [
  { id: 3, name: "Luxury Treatment", price: 150, description: "LUX001" },
];

const mockStylist = { id: 1, firstName: "John", lastName: "Doe" };

const defaultProps = {
  services: mockServices,
  luxuryServices: mockLuxuryServices,
  selectedService: null,
  selectedLuxuryService: null,
  selectedStylist: mockStylist,
  customPrice: "",
  serviceType: "regular",
  serviceKey: 0,
  luxuryServiceKey: 0,
  onServiceTypeChange: jest.fn(),
  onServiceSelect: jest.fn(),
  onLuxuryServiceSelect: jest.fn(),
  onCustomPriceChange: jest.fn(),
  onAddService: jest.fn(),
};

describe("ServicesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders service tabs correctly", () => {
    render(<ServicesSection {...defaultProps} />);
    
    expect(screen.getByText("Regular Services")).toBeInTheDocument();
    expect(screen.getByText("Luxury Services")).toBeInTheDocument();
  });

  test("shows regular services by default", () => {
    render(<ServicesSection {...defaultProps} />);
    
    expect(screen.getByLabelText("Select Service")).toBeInTheDocument();
    expect(screen.queryByLabelText("Select Luxury Service")).not.toBeInTheDocument();
  });

  test("switches to luxury services tab", () => {
    render(<ServicesSection {...defaultProps} serviceType="luxury" />);
    
    expect(screen.getByLabelText("Select Luxury Service")).toBeInTheDocument();
    expect(screen.queryByLabelText("Select Service")).not.toBeInTheDocument();
  });

  test("shows luxury service info when on luxury tab", () => {
    render(<ServicesSection {...defaultProps} serviceType="luxury" />);
    
    expect(screen.getByText("Luxury services are subject to sales tax.")).toBeInTheDocument();
  });

  test("disables add button when no service selected", () => {
    render(<ServicesSection {...defaultProps} />);
    
    const addButton = screen.getByText("ADD SERVICE");
    expect(addButton).toBeDisabled();
  });

  test("enables add button when service and stylist selected", () => {
    const props = {
      ...defaultProps,
      selectedService: mockServices[0],
    };
    
    render(<ServicesSection {...props} />);
    
    const addButton = screen.getByText("ADD SERVICE");
    expect(addButton).toBeEnabled();
  });

  test("calls onAddService when add button clicked", () => {
    const props = {
      ...defaultProps,
      selectedService: mockServices[0],
    };
    
    render(<ServicesSection {...props} />);
    
    const addButton = screen.getByText("ADD SERVICE");
    fireEvent.click(addButton);
    
    expect(props.onAddService).toHaveBeenCalledTimes(1);
  });

  test("calls onServiceTypeChange when tab clicked", () => {
    render(<ServicesSection {...defaultProps} />);
    
    const luxuryTab = screen.getByText("Luxury Services");
    fireEvent.click(luxuryTab);
    
    expect(defaultProps.onServiceTypeChange).toHaveBeenCalledWith("luxury");
  });
});
