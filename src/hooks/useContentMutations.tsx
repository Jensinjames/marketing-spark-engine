
import { useCreateContentMutation } from './content/useCreateContentMutation';
import { useUpdateContentMutation } from './content/useUpdateContentMutation';
import { useDeleteContentMutation } from './content/useDeleteContentMutation';
import { useToggleFavoriteMutation } from './content/useToggleFavoriteMutation';
import { useDuplicateContentMutation } from './content/useDuplicateContentMutation';

export const useContentMutations = () => {
  const createContent = useCreateContentMutation();
  const updateContent = useUpdateContentMutation();
  const deleteContent = useDeleteContentMutation();
  const toggleFavorite = useToggleFavoriteMutation();
  const duplicateContent = useDuplicateContentMutation();

  return {
    createContent,
    updateContent,
    deleteContent,
    toggleFavorite,
    duplicateContent,
    
    // Consolidated state
    isLoading: createContent.isPending || 
               updateContent.isPending || 
               deleteContent.isPending || 
               toggleFavorite.isPending || 
               duplicateContent.isPending,
    
    // Reset all mutations
    reset: () => {
      createContent.reset();
      updateContent.reset();
      deleteContent.reset();
      toggleFavorite.reset();
      duplicateContent.reset();
    }
  };
};
