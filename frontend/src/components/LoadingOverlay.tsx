import { Overlay } from './Overlay';

type Props = {
  isLoading: boolean;
};

export function LoadingOverlay({ isLoading }: Props) {
  if (!isLoading) return null;

  return (
    <Overlay>
      <div role="status" aria-label="解析中">
        解析中...
      </div>
    </Overlay>
  );
}
