import fs from 'fs'
import fetch, { type HeadersInit } from 'node-fetch'
import {
  type deleteCanceledOrdersParams,
  type deleteOrdersParams,
  type deleteOrdersWithFilterParams,
  type ShopifyOrderManagerConstructorParameters,
  type uploadOrdersFromJsonParams,
} from './types.js'

export default class ShopifyOrderManager {
  private accessToken: string
  private apiUrl: string
  private reqHeaders: HeadersInit

  public constructor({
    accessToken,
    apiUrl,
    reqHeaders,
  }: ShopifyOrderManagerConstructorParameters) {
    this.accessToken = accessToken
    this.apiUrl = apiUrl
    this.reqHeaders = {
      'content-type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
      ...reqHeaders,
    }
  }

  /**
   * Get all orders, map them to object with an id and cancel_reason, delete the canceled ones.
   */
  public async deleteCanceledOrders({
    onStartedDeleting,
    onFinishedDeleting,
  }: deleteCanceledOrdersParams): Promise<void> {
    let ordersToDelete: {
      id: string
      canceled: boolean
    }[] = []

    try {
      const res = await fetch(
        `${this.apiUrl}/orders.json?status=any&limit=250`,
        {
          method: 'get',
          headers: this.reqHeaders,
        }
      )

      const data = (await res.json()) as {
        orders: { id: string; cancel_reason?: string }[]
      }

      ordersToDelete = data.orders.map((order) => {
        return {
          id: order.id,
          canceled: order.cancel_reason != null,
        }
      })
    } catch (error) {
      console.error(error)
    }

    console.log(`Orders to delete: ${ordersToDelete.length}`)
    if (!!onStartedDeleting) onStartedDeleting()

    for (let index = 0; index < ordersToDelete.length; index++) {
      try {
        await fetch(`${this.apiUrl}/orders/${ordersToDelete[index].id}.json`, {
          method: 'delete',
          headers: this.reqHeaders,
        })
      } catch (error) {
        console.error(error)
        break
      }
      console.log(`Deleted order with id: ${ordersToDelete[index].id}`)
    }

    console.log('Deleted all canceled orders!')
    if (!!onFinishedDeleting) onFinishedDeleting()
  }

  /**
   * Get all orders, map them to object with just an id, apply filter and delete them.
   */
  public async deleteOrdersWithFilter({
    filterCallback,
    onStartedDeleting,
    onFinishedDeleting,
  }: deleteOrdersWithFilterParams): Promise<void> {
    let ordersToDelete: { id: string; canceled: boolean }[] = []

    try {
      const res = await fetch(
        `${this.apiUrl}/orders.json?status=any&limit=250`,
        {
          method: 'get',
          headers: this.reqHeaders,
        }
      )

      const data = (await res.json()) as {
        orders: { id: string; cancel_reason?: string }[]
      }

      const orders = data.orders.map((order) => {
        return {
          id: order.id,
          canceled: order.cancel_reason != null,
        }
      })

      ordersToDelete = !!filterCallback ? orders.filter(filterCallback) : orders
    } catch (error) {
      console.error(error)
    }

    console.log(`Orders to delete: ${ordersToDelete.length}`)
    if (!!onStartedDeleting) onStartedDeleting()

    for (let index = 0; index < ordersToDelete.length; index++) {
      try {
        await fetch(`${this.apiUrl}/orders/${ordersToDelete[index].id}.json`, {
          method: 'delete',
          headers: this.reqHeaders,
        })
      } catch (error) {
        console.error(error)
        break
      }
      console.log(`Deleted order with id: ${ordersToDelete[index].id}`)
    }

    console.log('Deleted orders!')
    if (!!onFinishedDeleting) onFinishedDeleting()
  }

  /**
   * Fetch all orders (shopify's api limits to 250) and delete them.
   */
  public async deleteOrders({
    onStartedDeleting,
    onFinishedDeleting,
  }: deleteOrdersParams): Promise<void> {
    let orderIds: string[] = []

    try {
      const res = await fetch(
        `${this.apiUrl}/orders.json?status=any&limit=250`,
        {
          method: 'get',
          headers: this.reqHeaders,
        }
      )
      const data = (await res.json()) as { orders: { id: string }[] }

      orderIds = data.orders.map((order) => order.id)
    } catch (error) {
      console.error(error)
    }

    console.log(`Orders to delete: ${orderIds.length}`)
    if (!!onStartedDeleting) onStartedDeleting()

    for (let index = 0; index < orderIds.length; index++) {
      try {
        await fetch(`${this.apiUrl}/orders/${orderIds[index]}.json`, {
          method: 'delete',
          headers: this.reqHeaders,
        })
      } catch (error) {
        console.error(error)
        break
      }

      console.log(`Deleted order number: ${index}`)
    }

    console.log('Deleted all orders!')
    if (!!onFinishedDeleting) onFinishedDeleting()
  }

  /**
   * Fetch all orders (shopify's api limits to 250)
   */
  public async getOrders(): Promise<unknown> {
    const res = await fetch(`${this.apiUrl}/orders.json?status=any&limit=250`, {
      method: 'get',
      headers: this.reqHeaders,
    })
    const data = await res.json()

    return data
  }

  /**
   * Upload orders to shopify from json data
   */
  public async uploadOrdersFromJson({
    ordersJsonFilePath,
    ordersMappingCallback,
  }: uploadOrdersFromJsonParams): Promise<void> {
    const rawdata = fs.readFileSync(ordersJsonFilePath)
    const orders = JSON.parse(rawdata.toString())
    let updatedOrdersArray = []

    if (!!!ordersMappingCallback) {
      updatedOrdersArray = orders.map((order: any) => {
        return {
          line_items: order['Products'].map((product: any) => {
            return {
              product_id: product['Product ID'],
              variant_id: product['Variant ID'],
              sku: product['SKU'],
              price: product['Price'],
              quantity: product['Quantity'],
            }
          }),
          phone: order['Billing Address Phone'],
          customer: {
            email: order['Customer Email'],
            first_name: order['Customer First Name'],
            last_name: order['Customer Last Name'],
            note: order['Note'],
            currency: order['Transaction currency'],
            addresses: [],
          },
          billing_address: {
            address1: order['Billing Address'],
            city: order['Billing Address City'],
            country: order['Billing Address Country'],
            first_name: order['Billing Address First Name'],
            last_name: order['Billing Address Last Name'],
            province: order['Billing province state'],
            zip: order['Billing Address Zip'],
            country_code: order['Shipping Address Country'],
          },
          shipping_address: {
            address1: order['Shipping Address'],
            city: order['Shipping Address City'],
            country: order['Shipping Address Country'],
            first_name: order['Shipping Address First Name'],
            last_name: order['Shipping Address Last Name'],
            province: order['Shipping Address Province State'],
            zip: order['Shipping Address Zip'],
            country_code: order['Shipping Address Country'],
          },
          current_total_price: order['Products']
            .reduce(
              (accumulator: number, currentValue: { price: number }) =>
                accumulator + currentValue.price,
              0
            )
            .toString(),
          currency: 'USD',
          fulfillment_status: 'fulfilled',
          tracking_number: order['Tracking Numbers'],
        }
      })
    } else {
      updatedOrdersArray = orders.map(ordersMappingCallback)
    }

    for (let index = 0; index < updatedOrdersArray.length; index++) {
      const order = updatedOrdersArray[index]

      try {
        const res = await fetch(`${this.apiUrl}/orders.json`, {
          method: 'post',
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            order,
          }),
        })
        const data = (await res.json()) as any

        // Get orderId and trackingnum
        if (!data.order) continue
        const orderId = data.order.id
        const trackingNumber = updatedOrdersArray[index].tracking_number

        // Get fullfilment id
        const response = await fetch(
          `${this.apiUrl}/orders/${orderId}/fulfillments.json`,
          {
            method: 'get',
            headers: {
              'X-Shopify-Access-Token': this.accessToken,
              'content-type': 'application/json',
            },
          }
        )
        const responseData = (await response.json()) as any

        const fulfillmentId = responseData.fulfillments[0].id

        // Update Fulfillment
        await fetch(
          `${this.apiUrl}/fulfillments/${fulfillmentId}/update_tracking.json`,
          {
            method: 'post',
            headers: {
              'X-Shopify-Access-Token': this.accessToken,
              'content-type': 'application/json',
            },

            body: JSON.stringify({
              fulfillment: {
                order_number: orderId,
                tracking_info: {
                  number: trackingNumber,
                  company: 'USPS',
                  url: `https://tools.usps.com/go/TrackConfirmAction.action?tLabels=${trackingNumber}`,
                },
              },
            }),
          }
        )
      } catch (error) {
        console.error(error)
        break
      }

      console.log(`Created order number: ${index}`)
    }

    console.log('Imported all orders to shopify!')
  }
}
