"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  CircleDashed,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  ClipboardList,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  createdAt: number
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

export default function OrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Handle scroll events
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = content
      setShowScrollToTop(scrollTop > 100)
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100)
    }

    content.addEventListener("scroll", handleScroll)
    return () => content.removeEventListener("scroll", handleScroll)
  }, [])

  const addCustomer = useCallback(() => {
    const newCustomer = {
      id: `${Date.now()}`,
      name: `顾客${customers.length + 1}`,
      orders: {},
      served: {},
      createdAt: Date.now(),
    }
    setCustomers((prevCustomers) => [...prevCustomers, newCustomer])
    setExpandedCustomerId(newCustomer.id)
  }, [customers.length])

  const removeCustomer = useCallback(
    (id: string) => {
      setCustomers((prevCustomers) => prevCustomers.filter((customer) => customer.id !== id))
      if (expandedCustomerId === id) {
        setExpandedCustomerId(null)
      }
      setCustomerToDelete(null)
    },
    [expandedCustomerId],
  )

  const removeAllCustomers = useCallback(() => {
    setCustomers([])
    setExpandedCustomerId(null)
    setIsDeleteAllDialogOpen(false)
  }, [])

  const updateOrder = useCallback((customerId: string, itemId: string, quantity: number) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) => {
        if (customer.id === customerId) {
          return {
            ...customer,
            orders: {
              ...customer.orders,
              [itemId]: Math.max(0, quantity),
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

  const toggleExpanded = useCallback((customerId: string) => {
    setExpandedCustomerId((prevId) => (prevId === customerId ? null : customerId))
  }, [])

  const calculateCustomerTotal = (customer: Customer) => {
    return Object.entries(customer.orders).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find((item) => item.id === itemId)
      return total + (item ? item.price * quantity : 0)
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

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToBottom = () => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" })
  }

  const getPendingFoodItems = () => {
    return menuItems
      .filter((item) => item.category === "food")
      .map((item) => {
        const pendingCount = customers.reduce((count, customer) => {
          if (customer.orders[item.id] && !customer.served[item.id]) {
            return count + customer.orders[item.id]
          }
          return count
        }, 0)

        const earliestCustomer = customers
          .filter((customer) => customer.orders[item.id] && !customer.served[item.id])
          .sort((a, b) => a.createdAt - b.createdAt)[0]

        return {
          name: item.name,
          pendingCount,
          earliestCustomer: earliestCustomer ? earliestCustomer.name : "无",
        }
      })
      .filter((item) => item.pendingCount > 0)
  }

  return (
    <Tabs defaultValue="orders" className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-md sticky top-0 z-10">
        <TabsList>
          <TabsTrigger value="orders">点菜表</TabsTrigger>
          <TabsTrigger value="summary">汇总</TabsTrigger>
        </TabsList>
        <h1 className="text-xl font-bold">良辰大油边</h1>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <ClipboardList className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>待上菜品列表</DialogTitle>
                <DialogDescription>以下是当前所有未上的食物及其数量，以及最早点单的顾客</DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>菜品</TableHead>
                    <TableHead>待上数量</TableHead>
                    <TableHead>最早顾客</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPendingFoodItems().map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.pendingCount}</TableCell>
                      <TableCell>{item.earliestCustomer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
          <Button onClick={addCustomer} size="icon" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="flex-grow overflow-y-auto px-2 py-4">
        <TabsContent value="orders" className="space-y-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = getCustomerStatus(customer)
                      switch (status) {
                        case "all":
                          return <CheckCircle2 className="h-5 w-5 text-green-500" />
                        case "partial":
                          return <Circle className="h-5 w-5 text-yellow-500" />
                        case "none":
                          return <CircleDashed className="h-5 w-5 text-gray-400" />
                      }
                    })()}
                    <span className="font-medium text-lg">{customer.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(customer.id)}>
                      {expandedCustomerId === customer.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setCustomerToDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expandedCustomerId === customer.id ? (
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{item.price}元</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {customer.orders[item.id] > 0 && (
                            <input
                              type="checkbox"
                              checked={customer.served[item.id] || false}
                              onChange={(e) => updateServedStatus(customer.id, item.id, e.target.checked)}
                              className="h-5 w-5 ml-2"
                            />
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <input
                            type="number"
                            min="0"
                            value={customer.orders[item.id] || 0}
                            onChange={(e) => updateOrder(customer.id, item.id, Number.parseInt(e.target.value) || 0)}
                            className="h-8 w-16 text-center border rounded"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateOrder(customer.id, item.id, (customer.orders[item.id] || 0) + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {menuItems
                      .filter((item) => customer.orders[item.id] > 0)
                      .map((item) => (
                        <span key={item.id} className="text-sm">
                          {item.name}
                          {customer.orders[item.id]} {customer.served[item.id] ? "已上" : "未上"} |
                        </span>
                      ))}
                  </div>
                )}
                <div className="mt-2 text-right font-medium">总计: {calculateCustomerTotal(customer)}元</div>
              </CardContent>
            </Card>
          ))}
          <div className="h-32"></div> {/* 添加底部空白 */}
        </TabsContent>
        <TabsContent value="summary">
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-lg">食物</h3>
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
                      {menuItems
                        .filter((item) => item.category === "food")
                        .map((item) => {
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
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>食物总收入</TableCell>
                        <TableCell className="text-right">
                          {menuItems
                            .filter((item) => item.category === "food")
                            .reduce((total, item) => total + calculateItemTotal(item.id) * item.price, 0)}
                          元
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-lg">饮料</h3>
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
                      {menuItems
                        .filter((item) => item.category === "drink")
                        .map((item) => {
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
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>饮料总收入</TableCell>
                        <TableCell className="text-right">
                          {menuItems
                            .filter((item) => item.category === "drink")
                            .reduce((total, item) => total + calculateItemTotal(item.id) * item.price, 0)}
                          元
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={3} className="font-medium text-lg">
                          总收入
                        </TableCell>
                        <TableCell className="text-right font-medium text-lg">
                          {menuItems.reduce((total, item) => total + calculateItemTotal(item.id) * item.price, 0)}元
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8">
                  <Button variant="destructive" onClick={() => setIsDeleteAllDialogOpen(true)} className="w-full">
                    删除所有顾客
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>

      {/* 删除单个顾客的确认对话框 */}
      <AlertDialog open={customerToDelete !== null} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>您确定要删除这个顾客吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => customerToDelete && removeCustomer(customerToDelete)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除所有顾客的确认对话框 */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除所有顾客</AlertDialogTitle>
            <AlertDialogDescription>您确定要删除所有顾客吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={removeAllCustomers}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showScrollToTop && (
        <Button className="fixed bottom-20 right-4 rounded-full" size="icon" onClick={scrollToTop}>
          <ChevronsUp className="h-4 w-4" />
        </Button>
      )}
      {showScrollToBottom && (
        <Button className="fixed bottom-4 right-4 rounded-full" size="icon" onClick={scrollToBottom}>
          <ChevronsDown className="h-4 w-4" />
        </Button>
      )}
    </Tabs>
  )
}

