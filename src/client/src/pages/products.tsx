import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductForm {
  name: string;
  price: number;
}

export default function Products() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery({ queryKey: ["/api/products"] });
  
  const form = useForm<ProductForm>();
  
  const createProduct = useMutation({
    mutationFn: (data: ProductForm) => api.post("/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      form.reset();
    },
    onError: () => {
      toast({ title: "Error creating product", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductForm) => {
    createProduct.mutate(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              placeholder="Name"
              {...form.register("name", { required: true })}
            />
            <Input
              placeholder="Price"
              type="number"
              step="0.01"
              {...form.register("price", { required: true, min: 0 })}
            />
            <Button type="submit">Create Product</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products?.map((product: any) => (
              <div key={product.id} className="p-4 border rounded">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
