import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TwoFactorPage } from '../../pages/TwoFactorPage';
import api from '../../api/client';

jest.mock('../../api/client');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('TwoFactorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with initial state', async () => {
    mockApi.get.mockResolvedValue({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Setup 2FA')).toBeInTheDocument();
    });
  });

  it('displays enabled state when 2FA is active', async () => {
    mockApi.get.mockResolvedValue({
      data: { enabled: true, backupCodesRemaining: 8 },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2-Factor Authentication is enabled/)).toBeInTheDocument();
      expect(screen.getByText(/Backup codes remaining: 8/)).toBeInTheDocument();
    });
  });

  it('initiates 2FA setup when Setup button is clicked', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: [
          'CODE1-1111',
          'CODE2-2222',
          'CODE3-3333',
          'CODE4-4444',
          'CODE5-5555',
          'CODE6-6666',
          'CODE7-7777',
          'CODE8-8888',
          'CODE9-9999',
          'CODE10-0000',
        ],
      },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Scan this QR code/)).toBeInTheDocument();
      expect(screen.getByText('TESTSECRET123')).toBeInTheDocument();
    });
  });

  it('verifies TOTP code and enables 2FA', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: ['CODE1-1111', 'CODE2-2222'],
      },
    });

    mockApi.post.mockResolvedValueOnce({
      data: { success: true },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 10 },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    // Start setup
    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    // Enter verification code
    await waitFor(() => {
      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });
      const verifyButton = screen.getByText('Verify Code');
      fireEvent.click(verifyButton);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/2fa/enable', expect.any(Object));
    });
  });

  it('displays backup codes after verification', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: ['CODE1-1111', 'CODE2-2222', 'CODE3-3333'],
      },
    });

    mockApi.post.mockResolvedValueOnce({
      data: { success: true },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 10 },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    // Setup and verify
    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });
      const verifyButton = screen.getByText('Verify Code');
      fireEvent.click(verifyButton);
    });

    await waitFor(() => {
      expect(screen.getByText('CODE1-1111')).toBeInTheDocument();
      expect(screen.getByText('CODE2-2222')).toBeInTheDocument();
    });
  });

  it('downloads backup codes', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: ['CODE1-1111', 'CODE2-2222'],
      },
    });

    mockApi.post.mockResolvedValueOnce({
      data: { success: true },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 10 },
    });

    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    // Setup and verify
    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });
      const verifyButton = screen.getByText('Verify Code');
      fireEvent.click(verifyButton);
    });

    await waitFor(() => {
      const downloadButton = screen.getByText('Download Backup Codes');
      fireEvent.click(downloadButton);
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('disables 2FA when confirm and password provided', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 10 },
    });

    mockApi.post.mockResolvedValueOnce({
      data: { success: true },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'prompt').mockReturnValue('password123');

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const disableButton = screen.getByText('Disable 2FA');
      fireEvent.click(disableButton);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/2fa/disable', {
        password: 'password123',
      });
    });
  });

  it('regenerates backup codes with password', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 3 },
    });

    mockApi.post.mockResolvedValueOnce({
      data: {
        backupCodes: ['NEW1-1111', 'NEW2-2222', 'NEW3-3333'],
      },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 10 },
    });

    jest.spyOn(window, 'prompt').mockReturnValue('password123');

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const regenerateButton = screen.getByText('Regenerate Backup Codes');
      fireEvent.click(regenerateButton);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/2fa/regenerate-backup-codes', {
        password: 'password123',
      });
    });
  });

  it('shows warning when backup codes running low', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: true, backupCodesRemaining: 2 },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Running low on backup codes/)).toBeInTheDocument();
    });
  });

  it('handles error during setup', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockRejectedValueOnce(
      new Error('Failed to generate 2FA setup')
    );

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate 2FA setup/)).toBeInTheDocument();
    });
  });

  it('handles error during verification', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: ['CODE1-1111'],
      },
    });

    mockApi.post.mockRejectedValueOnce(
      new Error('Invalid verification code')
    );

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '000000' } });
      const verifyButton = screen.getByText('Verify Code');
      fireEvent.click(verifyButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid verification code/)).toBeInTheDocument();
    });
  });

  it('requires verification code to verify', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { enabled: false, backupCodesRemaining: 0 },
    });

    mockApi.get.mockResolvedValueOnce({
      data: {
        qrCode: 'data:image/png;base64,test',
        secret: 'TESTSECRET123',
        backupCodes: ['CODE1-1111'],
      },
    });

    render(
      <BrowserRouter>
        <TwoFactorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const setupButton = screen.getByText('Setup 2FA');
      fireEvent.click(setupButton);
    });

    await waitFor(() => {
      const verifyButton = screen.getByText('Verify Code');
      expect(verifyButton).toBeDisabled();
    });
  });
});
