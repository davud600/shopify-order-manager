# shopify-order-manager

- Manage your orders in your shopify store (create, retrieve, fulfill orders...)
- Use callbacks to customise functionallity.

```
import ShopifyOrderManager from "shopify-order-manager";

const s = new ShopifyOrderManager({
  accessToken: "",
  apiUrl: "https://your-store.myshopify.com/admin/api/2023-07",
});

(async function () {
  const data = await s.getOrders();

  console.log({ data }); // Logs your store's orders

  // Uploading orders to shopify from json
  await s.uploadOrdersFromJson({ ordersJsonFilePath: "order.json" });

  /*
  Example orders.json file:

  [
    {
      "Products": [
        "Product ID": 12345678,
        "Variant ID": 123456789,
        "SKU": "00000-000",
        "Quantity": 1,
        "Price": 59.90
      ],
      "Financial Status": "paid",
      "Transaction kind": "sale",
      "Transaction status": "success",
      "Transaction currency": "USD",
      "Customer First Name": "a",
      "Customer Last Name": "a",
      "Customer Email": "a@gmail.com",
      "Billing Address First Name": "a",
      "Billing Address Last Name": "a",
      "Billing Address": "address",
      "Billing Address City": "city",
      "Billing Address Phone": "(000) 123-4567",
      "Billing province state": "WA",
      "Billing Address Country": "US",
      "Billing Address Zip": 98531,
      "Shipping Address First Name": "a",
      "Shipping Address Last Name": "a",
      "Shipping Address": "address",
      "Shipping Address City": "Centralia",
      "Shipping Address Phone": "(000) 123-4567",
      "Shipping Address Province State": "WA",
      "Shipping Address Country": "US",
      "Shipping Address Zip": 98531,
      "Note": "Note",
      "Tracking Numbers": "00000000000000"
    }
  ];
  */
})();
```

## Typsecript interfaces

```
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
```

## class ShopifyOrderManager

- deleteCanceledOrders({ onStartedDeleting?: Function, onFinishedDeleting?: Function}):
  - Get all orders, map them to object with an id and cancel_reason, delete the canceled ones.
  - Initial callback is called before starting the loop.
  - Final callback is called after the loop is finished.
- deleteOrdersWithFilter({filterCallback?: (order: any) => any[], onStartedDeleting?: Function, onFinishedDeleting?: Function})
  - Get all orders, map them to object with just an id, apply filter and delete them.
  - Initial callback is called before starting the loop.
  - Final callback is called after the loop is finished.
- deleteOrders({ onStartedDeleting?: Function, onFinishedDeleting?: Function })
  - Fetch all orders (shopify's api limits to 250) and delete them.
  - Initial callback is called before starting the loop.
  - Final callback is called after the loop is finished.
- getOrders()
  - Fetch all orders (shopify's api limits to 250)
- uploadOrdersFromJson({ ordersJsonFilePath: string, ordersMappingCallback?: (order: any) => any })
  - Upload orders to shopify from json data (You can use online tools to convert csv files to json)
  - You can use the ordersMappingCallback to customize the mapping between the json file and the shopify api (optional)
