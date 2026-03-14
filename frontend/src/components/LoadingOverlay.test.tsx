import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('TestLoadingOverlay_ShowWhileLoading: isLoading=trueでローディング要素が表示されること', () => {
    render(<LoadingOverlay isLoading={true} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('isLoading=falseで非表示になること', () => {
    render(<LoadingOverlay isLoading={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
