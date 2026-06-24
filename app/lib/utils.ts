export function serializeCustomer(customer: any) {
  return {
    ...customer,
    salePercentage: customer.salePercentage?.toNumber() ?? 0,
  }
}