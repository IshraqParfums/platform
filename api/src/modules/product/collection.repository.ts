import { Injectable } from '@nestjs/common';
import type { Collection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllOrdered(): Promise<Collection[]> {
    return this.prisma.collection.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findBySlug(slug: string): Promise<Collection | null> {
    return this.prisma.collection.findUnique({
      where: { slug },
    });
  }
}
