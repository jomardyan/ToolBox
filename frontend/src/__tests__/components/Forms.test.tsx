import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordModal } from '../../components/Forms/ChangePasswordModal';
import { AddPaymentMethodModal } from '../../components/Forms/AddPaymentMethodModal';
import { CreateApiKeyModal } from '../../components/Forms/CreateApiKeyModal';

describe('Form Components', () => {
  describe('ChangePasswordModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should render all password fields', () => {
      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/new password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    });

    test('should validate all fields required', async () => {
      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const submitButton = screen.getByText(/Update/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/All fields are required/i)).toBeInTheDocument();
      });
    });

    test('should validate password length', async () => {
      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'Password123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });

      const submitButton = screen.getByText(/Update/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    test('should validate password confirmation', async () => {
      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'Password123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword' } });

      const submitButton = screen.getByText(/Update/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/do not match/i)).toBeInTheDocument();
      });
    });

    test('should call onSubmit with correct data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword456' } });

      const submitButton = screen.getByText(/Update/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          currentPassword: 'CurrentPass123',
          newPassword: 'NewPassword456',
        });
      });
    });

    test('should close modal on cancel', () => {
      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close modal on successful submit', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ChangePasswordModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const currentPasswordInput = screen.getByPlaceholderText(/current password/i);
      const newPasswordInput = screen.getByPlaceholderText(/new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword456' } });

      const submitButton = screen.getByText(/Update/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('AddPaymentMethodModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should render credit card option by default', () => {
      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      expect(screen.getByPlaceholderText(/card number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/MM/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/YY/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/123/i)).toBeInTheDocument();
    });

    test('should toggle to bank account method', () => {
      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const bankRadio = screen.getByLabelText(/Bank Account/i);
      fireEvent.click(bankRadio);

      expect(screen.getByPlaceholderText(/routing number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/account number/i)).toBeInTheDocument();
    });

    test('should validate card fields', async () => {
      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const submitButton = screen.getByText(/Add/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/All card fields are required/i)).toBeInTheDocument();
      });
    });

    test('should validate bank account fields', async () => {
      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const bankRadio = screen.getByLabelText(/Bank Account/i);
      fireEvent.click(bankRadio);

      const submitButton = screen.getByText(/Add/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/All bank fields are required/i)).toBeInTheDocument();
      });
    });

    test('should submit card data correctly', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      fireEvent.change(screen.getByPlaceholderText(/card number/i), {
        target: { value: '4242424242424242' },
      });
      fireEvent.change(screen.getByPlaceholderText(/MM/i), { target: { value: '12' } });
      fireEvent.change(screen.getByPlaceholderText(/YY/i), { target: { value: '25' } });
      fireEvent.change(screen.getByPlaceholderText(/123/i), { target: { value: '123' } });

      const submitButton = screen.getByText(/Add/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          type: 'card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '25',
          cvc: '123',
        });
      });
    });

    test('should submit bank data correctly', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <AddPaymentMethodModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const bankRadio = screen.getByLabelText(/Bank Account/i);
      fireEvent.click(bankRadio);

      fireEvent.change(screen.getByPlaceholderText(/bank name/i), {
        target: { value: 'Bank of America' },
      });
      fireEvent.change(screen.getByPlaceholderText(/routing number/i), {
        target: { value: '021000021' },
      });
      fireEvent.change(screen.getByPlaceholderText(/account number/i), {
        target: { value: '123456789' },
      });

      const submitButton = screen.getByText(/Add/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          type: 'bank',
          bankName: 'Bank of America',
          routing: '021000021',
          account: '123456789',
        });
      });
    });
  });

  describe('CreateApiKeyModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should render form fields', () => {
      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      expect(screen.getByPlaceholderText(/Key Name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/90/)).toBeInTheDocument();
      expect(screen.getByText(/Read/i)).toBeInTheDocument();
    });

    test('should require key name', async () => {
      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const submitButton = screen.getByText(/Create Key/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/API key name is required/i)).toBeInTheDocument();
      });
    });

    test('should require at least one permission', async () => {
      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const keyNameInput = screen.getByPlaceholderText(/Key Name/i);
      fireEvent.change(keyNameInput, { target: { value: 'My API Key' } });

      // Uncheck all permissions
      const readCheckbox = screen.getByLabelText(/Read/i) as HTMLInputElement;
      fireEvent.click(readCheckbox);

      const submitButton = screen.getByText(/Create Key/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/At least one permission must be selected/i)
        ).toBeInTheDocument();
      });
    });

    test('should submit with correct data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const keyNameInput = screen.getByPlaceholderText(/Key Name/i);
      fireEvent.change(keyNameInput, { target: { value: 'Production API Key' } });

      const writeCheckbox = screen.getByLabelText(/Write/i);
      fireEvent.click(writeCheckbox);

      const submitButton = screen.getByText(/Create Key/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Production API Key',
          expiresAt: expect.any(String),
          permissions: ['read', 'write'],
        });
      });
    });

    test('should select different expiration periods', () => {
      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const expirationSelect = screen.getByDisplayValue(/90/) as HTMLSelectElement;
      fireEvent.change(expirationSelect, { target: { value: '365' } });

      expect(expirationSelect.value).toBe('365');
    });

    test('should close modal on cancel', () => {
      render(
        <CreateApiKeyModal onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
