import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cropImage } from './cropImage';

const MOCK_IMG_WIDTH = 1000;
const MOCK_IMG_HEIGHT = 2000;

class MockImage {
  naturalWidth = MOCK_IMG_WIDTH;
  naturalHeight = MOCK_IMG_HEIGHT;
  onload: () => void = () => {};
  onerror: () => void = () => {};
  set src(_: string) {
    this.onload();
  }
}

describe('cropImage', () => {
  let mockDrawImage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDrawImage = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: mockDrawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,test'
    );
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('TestCropImage_ReturnsDataUrl: データURLを返すこと', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const bbox = { x_min: 0.3, x_max: 0.5, y_min: 0.1, y_max: 0.9 };

    const result = await cropImage(file, bbox);

    expect(result).toBe('data:image/jpeg;base64,test');
  });

  it('TestCropImage_SquareCrop: 縦長バウンディングボックスで正方形クロップになること', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    // bbox幅=200px, bbox高=1600px の縦長
    const bbox = { x_min: 0.3, x_max: 0.5, y_min: 0.1, y_max: 0.9 };

    await cropImage(file, bbox);

    // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) の sw === sh
    const [, , , sw, sh] = mockDrawImage.mock.calls[0] as [
      unknown,
      unknown,
      unknown,
      number,
      number,
    ];
    expect(sw).toBe(sh);
  });

  it('TestCropImage_CenteredOnBbox: クロップがバウンディングボックスの中心に配置されること', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const bbox = { x_min: 0.3, x_max: 0.5, y_min: 0.4, y_max: 0.6 };

    await cropImage(file, bbox);

    const [, sx, sy, sw] = mockDrawImage.mock.calls[0] as [unknown, number, number, number];
    const bboxCenterX = ((bbox.x_min + bbox.x_max) / 2) * MOCK_IMG_WIDTH;
    const bboxCenterY = ((bbox.y_min + bbox.y_max) / 2) * MOCK_IMG_HEIGHT;
    // cropSide は drawImage の引数から取得（MARGIN_RATIO の具体値に依存しない）
    expect(sx).toBeCloseTo(bboxCenterX - sw / 2);
    expect(sy).toBeCloseTo(bboxCenterY - sw / 2);
  });

  it('TestCropImage_ClampTopLeft: 画像上端・左端を超えないこと', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    // bboxが左上端に寄っている → クランプで x=0, y=0 になること
    const bbox = { x_min: 0.0, x_max: 0.2, y_min: 0.0, y_max: 0.2 };

    await cropImage(file, bbox);

    const [, sx, sy] = mockDrawImage.mock.calls[0] as [unknown, number, number];
    expect(sx).toBeGreaterThanOrEqual(0);
    expect(sy).toBeGreaterThanOrEqual(0);
  });

  it('TestCropImage_ClampBottomRight: 画像右端・下端を超えないこと', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    // bboxが右下端に寄っている
    const bbox = { x_min: 0.8, x_max: 1.0, y_min: 0.8, y_max: 1.0 };

    await cropImage(file, bbox);

    const [, sx, sy, sw] = mockDrawImage.mock.calls[0] as [unknown, number, number, number];
    expect(sx + sw).toBeLessThanOrEqual(MOCK_IMG_WIDTH);
    expect(sy + sw).toBeLessThanOrEqual(MOCK_IMG_HEIGHT);
  });
});
