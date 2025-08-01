
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FoodItem } from '@/types/food';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, getExpiryStatus, getStatusColor } from '@/utils/expiryUtils';
import EditFoodItemDialog from '@/components/food/EditFoodItemDialog';
import { getFoodItemById, updateFoodItem, deleteFoodItem } from '@/services/foodItemService';
import { useAuth } from '@/context/AuthContext';

const FoodItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadItem = async () => {
      if (!isAuthenticated || !user || !id) {
        navigate('/inventory');
        return;
      }

      try {
        setLoading(true);
        const foundItem = await getFoodItemById(id);
        
        if (foundItem && foundItem.userId === user.id) {
          setItem(foundItem);
        } else {
          toast({
            title: "Item not found",
            description: "The requested food item could not be found.",
            variant: "destructive",
          });
          navigate('/inventory');
        }
      } catch (error) {
        console.error('Error loading food item:', error);
        toast({
          title: "Error loading item",
          description: "Could not load the food item details.",
          variant: "destructive",
        });
        navigate('/inventory');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, navigate, toast, isAuthenticated, user]);

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (item && user) {
      const success = await deleteFoodItem(item.id, user.id);
      if (success) {
        toast({
          title: "Item Deleted",
          description: "Food item has been removed from your inventory.",
        });
        navigate('/inventory');
      } else {
        toast({
          title: "Delete Error",
          description: "Failed to delete the item.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSaveEdit = async (updatedItem: FoodItem) => {
    if (!user) return;

    const result = await updateFoodItem(updatedItem, user.id);
    if (result) {
      setItem(result);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Item Updated",
        description: "Food item has been successfully updated.",
      });
    } else {
      toast({
        title: "Update Error",
        description: "Failed to update the item.",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view item details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Item not found.</p>
          <Button onClick={() => navigate('/inventory')} className="mt-4">
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  const status = getExpiryStatus(item.expiryDate);
  const statusColor = getStatusColor(status);

  // Generate a placeholder image URL if no real image
  const placeholderImage = "https://images.unsplash.com/photo-1616403682245-714c950a5a28?q=80&w=500&auto=format&fit=crop";

  return (
    <div>
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Pencil size={16} />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash size={16} />
            Delete
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${statusColor}`} />
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{item.name}</CardTitle>
              <p className="text-muted-foreground">{item.category}</p>
            </div>
            <Badge variant={status === 'expired' ? 'outline' : 'default'} className={statusColor}>
              {status === 'expired' ? 'Expired' : 
               status === 'danger' ? 'Critical' : 
               status === 'warning' ? 'Soon' : 'Safe'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Image */}
            <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img 
                src={item.imageUrl || placeholderImage} 
                alt={item.name}
                className="w-full h-64 object-cover"
              />
            </div>
            
            {/* Right column - Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Product ID</h3>
                    <p className="font-mono text-sm">{item.id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                    <p>{item.quantity} {item.unit}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Barcode</h3>
                    <p className="font-mono text-sm">{item.barcode || "None"}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date Added</h3>
                    <p>{formatDate(item.addedDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Expiry Date</h3>
                    <p className={status === 'expired' ? 'text-red-500' : ''}>
                      {formatDate(item.expiryDate)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                  </div>
                </div>
              </div>
              
              {item.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {item.notes}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Storage Recommendations</h3>
                <p className="mt-1 text-sm">
                  {item.category === 'Dairy' && "Store refrigerated between 1-4°C."}
                  {item.category === 'Fruits' && "Store at room temperature until ripe, then refrigerate."}
                  {item.category === 'Meat' && "Keep refrigerated below 4°C or freeze."}
                  {item.category === 'Vegetables' && "Store in the crisper drawer of your refrigerator."}
                  {item.category === 'Bakery' && "Store in a cool, dry place or freeze to extend shelf life."}
                  {!['Dairy', 'Fruits', 'Meat', 'Vegetables', 'Bakery'].includes(item.category) && 
                    "Store according to package instructions."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditFoodItemDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        item={item}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default FoodItemDetails;
