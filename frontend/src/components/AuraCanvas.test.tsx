import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { AuraCanvas } from './AuraCanvas';

describe('AuraCanvas', () => {
  it('TestAuraCanvas_Render: <canvas>要素が描画されること', () => {
    render(<AuraCanvas items={[]} onItemSelect={vi.fn()} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
