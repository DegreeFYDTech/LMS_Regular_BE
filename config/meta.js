import dotenv from 'dotenv';
dotenv.config();

export const MetaConfig = {
  VERSION: process.env.META_GRAPH_VERSION || 'v24.0',
  BASE_URL: 'https://graph.facebook.com',
  get GRAPH_API() {
    return `${this.BASE_URL}/${this.VERSION}`;
  }
};


export const getMetaUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${MetaConfig.GRAPH_API}${cleanEndpoint}`;
};
