export interface AdminCollectionResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface CreateCollectionBody {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateCollectionBody {
  name?: string;
  slug?: string;
  description?: string | null;
}
