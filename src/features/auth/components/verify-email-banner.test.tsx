import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VerifyEmailBanner } from './verify-email-banner';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('VerifyEmailBanner', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the banner with resend button', () => {
    render(<VerifyEmailBanner />);
    expect(screen.getByText('Tu email no está verificado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar/i })).toBeInTheDocument();
  });

  it('shows sent confirmation after successful resend', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    render(<VerifyEmailBanner />);
    fireEvent.click(screen.getByRole('button', { name: /reenviar/i }));
    await waitFor(() => expect(screen.getByText('Enviado')).toBeInTheDocument());
  });

  it('shows error toast on failed resend', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.post).mockRejectedValueOnce(new Error('fail'));
    render(<VerifyEmailBanner />);
    fireEvent.click(screen.getByRole('button', { name: /reenviar/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
