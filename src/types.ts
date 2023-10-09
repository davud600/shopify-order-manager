import { type HeadersInit } from 'node-fetch'

export interface ShopifyOrderManagerConstructorParameters {
  accessToken: string
  apiUrl: string
  reqHeaders?: HeadersInit
}

export interface deleteOrdersWithFilterParams {
  filterCallback?: (order: any) => any[]
  onStartedDeleting?: Function
  onFinishedDeleting?: Function
}

export interface deleteCanceledOrdersParams {
  onStartedDeleting?: Function
  onFinishedDeleting?: Function
}

export interface deleteOrdersParams {
  onStartedDeleting?: Function
  onFinishedDeleting?: Function
}

export interface uploadOrdersFromJsonParams {
  ordersJsonFilePath: string
  ordersMappingCallback?: (order: any) => any
}
