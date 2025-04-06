import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { join, extname } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class FileService {
  private readonly imagesFolder = join(process.cwd(), '/../uploads/images');
  private readonly productsFolder = join(process.cwd(), '/../uploads/products');

  constructor() {
    fs.mkdir(this.imagesFolder, { recursive: true }).catch(() => null);
    fs.mkdir(this.productsFolder, { recursive: true }).catch(() => null);
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(`Invalid file type: ${fileExtension}`);
    }

    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = join(this.imagesFolder, fileName);

    await fs.writeFile(filePath, file.buffer); 

    return fileName;
  }

  async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    try {
      await fs.mkdir(this.imagesFolder, { recursive: true });

      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      const fileNames = await Promise.all(
        files.map(async (file) => {
          const fileExtension = extname(file.originalname).toLowerCase();

          if (!allowedExtensions.includes(fileExtension)) {
            throw new BadRequestException(`Invalid file type: ${fileExtension}. Only images are allowed.`);
          }

          const fileName = `${uuidv4()}${fileExtension}`;
          const filePath = join(this.imagesFolder, fileName);

          await fs.writeFile(filePath, file.buffer);
          return fileName;
        })
      );

      return fileNames;
    } catch (error) {
      throw new BadRequestException(`Error saving files: ${error.message}`);
    }
  }

  async saveZipFile(file: Express.Multer.File): Promise<string> {
    if (extname(file.originalname).toLowerCase() !== '.zip') {
      throw new BadRequestException('Only ZIP files are allowed');
    }

    const fileName = `${uuidv4()}.zip`;
    const filePath = join(this.productsFolder, fileName);

    await fs.writeFile(filePath, file.buffer);

    return fileName;
  }

  async deleteFile(fileName: string, type: 'image' | 'zip'): Promise<void> {
    try {
      const folder = type === 'image' ? this.imagesFolder : this.productsFolder;
      const filePath = join(folder, fileName);

      if (!(await this.fileExists(filePath))) {
        throw new BadRequestException('File not found');
      }

      await fs.unlink(filePath);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error deleting file');
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
