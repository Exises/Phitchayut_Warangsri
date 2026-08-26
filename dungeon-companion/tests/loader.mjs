import { URL, fileURLToPath } from 'url';
import fs from 'fs';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const resolvedUrl = new URL(specifier, context.parentURL);
    const pathWithoutExt = fileURLToPath(resolvedUrl);
    if (!pathWithoutExt.endsWith('.js') && !pathWithoutExt.endsWith('.jsx')) {
      if (fs.existsSync(pathWithoutExt + '.js')) {
        return nextResolve(resolvedUrl.href + '.js', context);
      }
      if (fs.existsSync(pathWithoutExt + '.jsx')) {
        return nextResolve(resolvedUrl.href + '.jsx', context);
      }
    }
  }
  return nextResolve(specifier, context);
}
