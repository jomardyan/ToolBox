import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OAuthPage } from '../../pages/OAuthPage';
import api from '../../api/client';

jest.mock('../../api/client');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('OAuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders OAuth login section with social buttons', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: [] },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with GitHub/)).toBeInTheDocument();
    });
  });

  it('renders account linking section', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: [] },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
      expect(screen.getByText('Link social accounts for easier login')).toBeInTheDocument();
    });
  });

  it('initiates Google OAuth when button clicked', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { authUrl: 'https://accounts.google.com/oauth/auth?code=test' },
    });

    const hrefSpy = jest.spyOn(window.location, 'href', 'set');

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const googleButton = screen.getAllByText(/Sign in with Google/)[0];
      fireEvent.click(googleButton);
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/google/auth');
    });
  });

  it('initiates GitHub OAuth when button clicked', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { authUrl: 'https://github.com/login/oauth/authorize?code=test' },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const githubButton = screen.getAllByText(/Sign in with GitHub/)[0];
      fireEvent.click(githubButton);
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/github/auth');
    });
  });

  it('displays linked accounts status', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: ['google', 'github'] },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const unlinkButtons = screen.getAllByText('Unlink');
      expect(unlinkButtons.length).toBe(2);
    });
  });

  it('allows linking Google account', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { authUrl: 'https://accounts.google.com/oauth/auth?code=test' },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const linkButtons = screen.getAllByText('Link');
      fireEvent.click(linkButtons[0]); // Google is first
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/google/auth');
    });
  });

  it('allows linking GitHub account', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    mockApi.get.mockResolvedValueOnce({
      data: { authUrl: 'https://github.com/login/oauth/authorize?code=test' },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const linkButtons = screen.getAllByText('Link');
      fireEvent.click(linkButtons[1]); // GitHub is second
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/github/auth');
    });
  });

  it('unlinkles account with confirmation', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: ['google'] },
    });

    mockApi.delete.mockResolvedValue({
      data: { success: true },
    });

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);
    });

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('unlink your google account')
      );
      expect(mockApi.delete).toHaveBeenCalledWith('/oauth/google');
    });
  });

  it('cancels unlink when user declines confirmation', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: ['google'] },
    });

    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);
    });

    // Verify delete was not called
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it('handles OAuth initiation error', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    mockApi.get.mockRejectedValueOnce(
      new Error('Failed to initiate Google login')
    );

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const googleButton = screen.getAllByText(/Sign in with Google/)[0];
      fireEvent.click(googleButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to initiate Google login/)).toBeInTheDocument();
    });
  });

  it('handles unlinking error', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: ['github'] },
    });

    mockApi.delete.mockRejectedValue(
      new Error('Cannot unlink - no password set')
    );

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const unlinkButton = screen.getByText('Unlink');
      fireEvent.click(unlinkButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cannot unlink - no password set/)).toBeInTheDocument();
    });
  });

  it('fetches linked accounts on mount', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: ['google', 'github'] },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/accounts');
    });
  });

  it('updates linked accounts after linking', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    // Initial fetch
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: [] },
    });

    // After linking
    mockApi.get.mockResolvedValueOnce({
      data: { accounts: ['google'] },
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/oauth/accounts');
    });
  });

  it('displays both Google and GitHub social buttons', async () => {
    mockApi.get.mockResolvedValue({
      data: { accounts: [] },
    });

    render(
      <BrowserRouter>
        <OAuthPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const googleButtons = screen.getAllByText(/Google/);
      const githubButtons = screen.getAllByText(/GitHub/);
      expect(googleButtons.length).toBeGreaterThan(0);
      expect(githubButtons.length).toBeGreaterThan(0);
    });
  });
});
