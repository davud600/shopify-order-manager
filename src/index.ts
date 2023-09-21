import fetch from 'node-fetch'
import fs from 'fs'

export interface ConstructorParameters {
  accessToken: string
  apiUrl?: string
}

export default class ShopifyOrderManager {
  private accessToken: string
  private apiUrl?: string

  public constructor({ accessToken, apiUrl }: ConstructorParameters) {
    this.accessToken = accessToken
    this.apiUrl = apiUrl
  }

  public async uploadOrderFromJson(ordersJsonFilePath: string) {
    const rawdata = fs.readFileSync(ordersJsonFilePath)
    const orders = JSON.parse(rawdata.toString())

    const updatedOrdersArray = orders.map((order: any) => {
      return {
        line_items: [
          {
            product_id: order['Product ID'],
            variant_id: order['Variant ID'],
            sku: order['SKU'],
            price: 59.9,
            quantity: 1,
          },
        ],
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
        current_total_price: '59.90',
        currency: 'USD',
        fulfillment_status: 'fulfilled',
        tracking_number: order['Tracking Numbers'],
      }
    })

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
