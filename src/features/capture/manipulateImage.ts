import {
  ImageManipulator,
  type Action,
  type ImageResult,
  type SaveOptions,
} from 'expo-image-manipulator';

export async function manipulateImage(
  uri: string,
  actions: readonly Action[],
  saveOptions: SaveOptions,
): Promise<ImageResult> {
  const context = ImageManipulator.manipulate(uri);
  try {
    for (const action of actions) {
      if ('crop' in action) context.crop(action.crop);
      else if ('resize' in action) context.resize(action.resize);
      else if ('rotate' in action) context.rotate(action.rotate);
      else if ('flip' in action) context.flip(action.flip);
      else if ('extent' in action) context.extent(action.extent);
    }
    const rendered = await context.renderAsync();
    try {
      return await rendered.saveAsync(saveOptions);
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
