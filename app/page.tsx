"use client"

import { TableHeader } from "@/components/ui/table"

import { useState, useCallback, useEffect } from "react"
import { Plus, Trash2, Minus, CheckCircle2, Circle, CircleDashed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MenuItem {
  id: string
  name: string
  price: number
  category: "food" | "drink"
}

interface Customer {
  id: string
  name: string
  orders: Record<string, number>
  served: Record<string, boolean>
}

const menuItems: MenuItem[] = [
  { id: "da-you-bian", name: "油边", price: 25, category: "food" },
  { id: "lamb-kidney", name: "腰子", price: 25, category: "food" },
  { id: "pork-belly", name: "五花", price: 20, category: "food" },
  { id: "lamb-skewer", name: "羊肉串", price: 5, category: "food" },
  { id: "chicken-gizzard", name: "鸡胗", price: 5, category: "food" },
  { id: "roasted-flatbread", name: "烧饼", price: 4, category: "food" },
  { id: "fish-tofu", name: "鱼豆腐", price: 2, category: "food" },
  { id: "canned-da-yao", name: "易拉罐大窑", price: 5, category: "drink" },
  { id: "yanjing-beer", name: "燕京啤酒", price: 5, category: "drink" },
  { id: "yanjing-u8", name: "燕京u8啤酒", price: 8, category: "drink" },
]

const calculatePendingItems = (customers: Customer[], itemId: string) => {
  return customers.reduce((total, customer) => {
    const ordered = customer.orders[itemId] || 0
    const served = customer.served[itemId] ? customer.orders[itemId] : 0
    return total + (ordered - served)
  }, 0)
}

export default function OrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])

  const foodItems = menuItems.filter((item) => item.category === "food")
  const drinkItems = menuItems.filter((item) => item.category === "drink")

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem("customers")
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers))
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers))
  }, [customers])

  const addCustomer = useCallback(() => {
    const newCustomer = {
      id: `${Date.now()}`,
      name: `顾客${customers.length + 1}`,
      orders: {},
      served: {},
    }
    setCustomers((prevCustomers) => [...prevCustomers, newCustomer])
  }, [customers.length])

  const removeCustomer = useCallback((id: string) => {
    setCustomers((prevCustomers) => prevCustomers.filter((customer) => customer.id !== id))
  }, [])

  const updateOrder = useCallback((customerId: string, itemId: string, quantity: number) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) => {
        if (customer.id === customerId) {
          return {
            ...customer,
            orders: {
              ...customer.orders,
              [itemId]: Math.max(0, quantity), // Ensure quantity is not negative
            },
          }
        }
        return customer
      }),
    )
  }, [])

  const updateServedStatus = useCallback((customerId: string, itemId: string, isServed: boolean) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) => {
        if (customer.id === customerId) {
          return {
            ...customer,
            served: {
              ...customer.served,
              [itemId]: customer.orders[itemId] > 0 ? isServed : false,
            },
          }
        }
        return customer
      }),
    )
  }, [])

  const calculateCustomerTotal = (customer: Customer) => {
    return Object.entries(customer.orders).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find((item) => item.id === itemId)
      return total + (item ? item.price * quantity : 0)
    }, 0)
  }

  const calculateGrandTotal = () => {
    return customers.reduce((total, customer) => {
      return total + calculateCustomerTotal(customer)
    }, 0)
  }

  const calculateItemTotal = (itemId: string) => {
    return customers.reduce((total, customer) => {
      return total + (customer.orders[itemId] || 0)
    }, 0)
  }

  const getCustomerStatus = (customer: Customer) => {
    const orderedItems = Object.keys(customer.orders).filter((itemId) => customer.orders[itemId] > 0)
    if (orderedItems.length === 0) return "none"

    const servedItems = orderedItems.filter((itemId) => customer.served[itemId])
    if (servedItems.length === 0) return "none"
    if (servedItems.length === orderedItems.length) return "all"
    return "partial"
  }

  return (
    <div className="container mx-auto px-2 py-4">
      <h1 className="text-2xl font-bold text-center mb-4">良辰大油边</h1>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="orders">点菜表</TabsTrigger>
          <TabsTrigger value="summary">汇总</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-lg mb-2">添加顾客</CardTitle>
              <div className="flex flex-col space-y-2">
                <Button onClick={addCustomer} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  添加新顾客
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="relative">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="sticky left-0 z-20 bg-muted/50 font-medium">未上菜</TableHead>
                        {foodItems.map((item) => (
                          <TableHead key={item.id} className="text-center p-2 font-medium">
                            {calculatePendingItems(customers, item.id)}
                          </TableHead>
                        ))}
                        {drinkItems.map((item) => (
                          <TableHead key={item.id} className="text-center p-2 font-medium">
                            {calculatePendingItems(customers, item.id)}
                          </TableHead>
                        ))}
                        <TableHead className="sticky right-0 z-20 bg-muted/50"></TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="sticky left-0 z-20 bg-background w-24">顾客</TableHead>

                        {/* 食物标题 */}
                        <TableHead colSpan={foodItems.length} className="text-center bg-muted/50">
                          食物
                        </TableHead>

                        {/* 饮料标题 */}
                        <TableHead colSpan={drinkItems.length} className="text-center bg-muted/50">
                          饮料
                        </TableHead>

                        <TableHead className="sticky right-0 z-20 bg-background w-20 text-right">总计</TableHead>
                      </TableRow>

                      <TableRow>
                        <TableHead className="sticky left-0 z-20 bg-background"></TableHead>

                        {/* 食物列 */}
                        {foodItems.map((item) => (
                          <TableHead key={item.id} className="text-center p-2 min-w-24">
                            <div className="font-medium text-xs">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.price}元</div>
                          </TableHead>
                        ))}

                        {/* 饮料列 */}
                        {drinkItems.map((item) => (
                          <TableHead key={item.id} className="text-center p-2 min-w-24">
                            <div className="font-medium text-xs">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.price}元</div>
                          </TableHead>
                        ))}

                        <TableHead className="sticky right-0 z-20 bg-background"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="sticky left-0 z-20 bg-background font-medium p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {(() => {
                                  const status = getCustomerStatus(customer)
                                  switch (status) {
                                    case "all":
                                      return <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    case "partial":
                                      return <Circle className="h-4 w-4 text-yellow-500" />
                                    case "none":
                                      return <CircleDashed className="h-4 w-4 text-gray-400" />
                                  }
                                })()}
                                <span className="truncate max-w-16">{customer.name}</span>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除 {customer.name} 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeCustomer(customer.id)
                                      }}
                                    >
                                      确认删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>

                          {/* 食物数量输入 */}
                          {foodItems.map((item) => (
                            <TableCell key={item.id} className="p-1 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) - 1)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={customer.orders[item.id] || 0}
                                    onChange={(e) =>
                                      updateOrder(customer.id, item.id, Number.parseInt(e.target.value) || 0)
                                    }
                                    className="h-8 w-12 text-center border rounded"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) + 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                {customer.orders[item.id] > 0 && (
                                  <input
                                    type="checkbox"
                                    checked={customer.served[item.id] || false}
                                    onChange={(e) => updateServedStatus(customer.id, item.id, e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                )}
                              </div>
                            </TableCell>
                          ))}

                          {/* 饮料数量输入 */}
                          {drinkItems.map((item) => (
                            <TableCell key={item.id} className="p-1 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) - 1)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={customer.orders[item.id] || 0}
                                    onChange={(e) =>
                                      updateOrder(customer.id, item.id, Number.parseInt(e.target.value) || 0)
                                    }
                                    className="h-8 w-12 text-center border rounded"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) + 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                {customer.orders[item.id] > 0 && (
                                  <input
                                    type="checkbox"
                                    checked={customer.served[item.id] || false}
                                    onChange={(e) => updateServedStatus(customer.id, item.id, e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                )}
                              </div>
                            </TableCell>
                          ))}

                          <TableCell className="sticky right-0 z-20 bg-background font-medium text-right p-2">
                            {calculateCustomerTotal(customer)}元
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    <TableFooter>
                      <TableRow>
                        <TableCell className="sticky left-0 z-20 bg-muted font-medium">总数量</TableCell>

                        {/* 食物总数量 */}
                        {foodItems.map((item) => (
                          <TableCell key={item.id} className="text-center font-medium">
                            {calculateItemTotal(item.id)}
                          </TableCell>
                        ))}

                        {/* 饮料总数量 */}
                        {drinkItems.map((item) => (
                          <TableCell key={item.id} className="text-center font-medium">
                            {calculateItemTotal(item.id)}
                          </TableCell>
                        ))}

                        <TableCell className="sticky right-0 z-20 bg-muted font-medium text-right">
                          {calculateGrandTotal()}元
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>订单汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">食物</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>菜品</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead className="text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {foodItems.map((item) => {
                        const quantity = calculateItemTotal(item.id)
                        if (quantity === 0) return null
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.price}元</TableCell>
                            <TableCell>{quantity}</TableCell>
                            <TableCell className="text-right">{quantity * item.price}元</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-medium mb-2">饮料</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>饮品</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead className="text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drinkItems.map((item) => {
                        const quantity = calculateItemTotal(item.id)
                        if (quantity === 0) return null
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.price}元</TableCell>
                            <TableCell>{quantity}</TableCell>
                            <TableCell className="text-right">{quantity * item.price}元</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>总计</span>
                    <span>{calculateGrandTotal()}元</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

