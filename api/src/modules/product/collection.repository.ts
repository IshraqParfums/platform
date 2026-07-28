import { Injectable } from '@nestjs/common';
import type { Collection, Prisma } from '@prisma/client';
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

  findById(id: string): Promise<Collection | null> {
    return this.prisma.collection.findUnique({
      where: { id },
    });
  }

  create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return this.prisma.collection.create({ data });
  }

  update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return this.prisma.collection.update({ where: { id }, data });
  }
}
