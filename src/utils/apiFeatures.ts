import { Prisma } from '@prisma/client';

class APIFeatures {
  private where: Prisma.TemplateWhereInput = {};
  private orderBy: Prisma.TemplateOrderByWithRelationInput = {};
  private skip: number = 0;
  private take: number = 10;
  private include: Prisma.TemplateInclude = {};

  constructor() {}

  search(query?: string) {
    if (query) {
      this.where = {
        ...this.where,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      };
    }
    return this;
  }

  filter(userId?: string) {
    if (userId) {
      this.where = {
        ...this.where,
        AND: [
          {
            OR: [
              { isPublic: true },
              { authorId: userId },
              { allowedUsers: { some: { id: userId } } },
            ],
          },
        ],
      };
    } else {
      this.where = {
        ...this.where,
        isPublic: true,
      };
    }
    return this;
  }

  sort(sortBy?: string) {
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      this.orderBy = {
        [field]: order === 'desc' ? 'desc' : 'asc',
      };
    } else {
      this.orderBy = {
        createdAt: 'desc',
      };
    }
    return this;
  }

  paginate(page: number = 1, limit: number = 10) {
    this.skip = (page - 1) * limit;
    this.take = limit;
    return this;
  }

  includeAuthor() {
    this.include = {
      ...this.include,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
    return this;
  }

  includeTags() {
    this.include = {
      ...this.include,
      tags: true,
    };
    return this;
  }

  includeCounts() {
    this.include = {
      ...this.include,
      _count: {
        select: {
          forms: true,
          likes: true,
        },
      },
    };
    return this;
  }

  getQuery() {
    return {
      where: this.where,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
      include: this.include,
    };
  }
}

export default APIFeatures;