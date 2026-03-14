import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorModal } from './ErrorModal';

describe('ErrorModal', () => {
  it('TestErrorModal_ShowMessage: isOpen=trueでメッセージが表示されること', () => {
    render(<ErrorModal isOpen={true} message="商品が検出できませんでした" onClose={vi.fn()} />);

    expect(screen.getByText('商品が検出できませんでした')).toBeInTheDocument();
  });

  it('isOpen=falseで非表示になること', () => {
    render(<ErrorModal isOpen={false} message="商品が検出できませんでした" onClose={vi.fn()} />);

    expect(screen.queryByText('商品が検出できませんでした')).not.toBeInTheDocument();
  });
});
