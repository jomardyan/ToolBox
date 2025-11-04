import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AccountSettingsPage } from '../../pages/AccountSettingsPage';
import * as api from '../../api/client';

jest.mock('../../api/client');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccountSettingsPage', () => {
  const mockUserProfile = {
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Test Corp',
    phone: '555-1234',
    address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    postalCode: '02101',
    country: 'USA',
    avatar: 'https://example.com/avatar.jpg',
    emailVerified: true,
    twoFactorEnabled: false,
    lastLoginAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Update Section', () => {
    test('should render profile section with user data', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    test('should update profile successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.put.mockResolvedValue({
        data: { ...mockUserProfile, firstName: 'Jane' },
      });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getAllByText(/Save/i)[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith(
          '/user/account/profile',
          expect.objectContaining({
            firstName: 'Jane',
          })
        );
      });
    });

    test('should show error if first name is empty', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: '' } });

      const saveButton = screen.getAllByText(/Save/i)[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/First name and last name are required/i)).toBeInTheDocument();
      });
    });

    test('should display success toast on profile update', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.put.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getAllByText(/Save/i)[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Change Section', () => {
    test('should show current email and verification status', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
        expect(screen.getByText(/✓ Verified/i)).toBeInTheDocument();
      });
    });

    test('should change email with password verification', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.post.mockResolvedValue({
        data: { message: 'Verification email sent' },
      });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });

      // Find and fill email change form
      const changeEmailBtn = screen.getByText(/Change Email/i);
      fireEvent.click(changeEmailBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/new email/i)).toBeInTheDocument();
      });

      const newEmailInput = screen.getByPlaceholderText(/new email/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(/confirm password/i) as HTMLInputElement;

      fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'CurrentPassword123' } });

      const confirmBtn = screen.getByText(/Confirm Email Change/i);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          '/user/account/change-email',
          expect.objectContaining({
            newEmail: 'newemail@example.com',
            currentPassword: 'CurrentPassword123',
          })
        );
      });
    });

    test('should require password for email change', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });

      const changeEmailBtn = screen.getByText(/Change Email/i);
      fireEvent.click(changeEmailBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/new email/i)).toBeInTheDocument();
      });

      const newEmailInput = screen.getByPlaceholderText(/new email/i) as HTMLInputElement;
      fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });

      const confirmBtn = screen.getByText(/Confirm Email Change/i);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Change Section', () => {
    test('should validate password requirements', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
      });

      const changePasswordBtn = screen.getByText(/Change Password/i);
      fireEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByPlaceholderText(/New password/i) as HTMLInputElement;
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });

      const confirmBtn = screen.getByText(/Update Password/i);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    test('should verify password match', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
      });

      const changePasswordBtn = screen.getByText(/Change Password/i);
      fireEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByPlaceholderText(/New password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /Confirm password/i
      ) as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword' } });

      const confirmBtn = screen.getByText(/Update Password/i);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/do not match/i)).toBeInTheDocument();
      });
    });

    test('should change password successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.post.mockResolvedValue({
        data: { message: 'Password changed successfully' },
      });

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
      });

      const changePasswordBtn = screen.getByText(/Change Password/i);
      fireEvent.click(changePasswordBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByPlaceholderText(
        /current password/i
      ) as HTMLInputElement;
      const newPasswordInput = screen.getByPlaceholderText(/New password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /Confirm password/i
      ) as HTMLInputElement;

      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword456' } });

      const confirmBtn = screen.getByText(/Update Password/i);
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          '/user/account/change-password',
          expect.objectContaining({
            currentPassword: 'CurrentPassword123',
            newPassword: 'NewPassword456',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error if profile fetch fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load account settings/i)).toBeInTheDocument();
      });
    });

    test('should display error message from API', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.put.mockRejectedValue(new Error('Email already exists'));

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getAllByText(/Save/i)[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state during profile fetch', () => {
      mockApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUserProfile }), 100))
      );

      renderWithRouter(<AccountSettingsPage />);

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    test('should disable form during submission', async () => {
      mockApi.get.mockResolvedValue({ data: mockUserProfile });
      mockApi.put.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUserProfile }), 500))
      );

      renderWithRouter(<AccountSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getAllByText(/Save/i)[0];
      fireEvent.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });
});
