import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wrapper que funciona no web e mobile
const Storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      return localStorage.setItem(key, value);
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.removeItem(key);
    }
    return AsyncStorage.removeItem(key);
  },
};

export default function App() {
  const [view, setView] = useState('lista');
  const [recipes, setRecipes] = useState([]);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [preparationMethod, setPreparationMethod] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Carregar receitas
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const storedRecipes = await Storage.getItem('@recipes');
        if (storedRecipes !== null) {
          setRecipes(JSON.parse(storedRecipes));
        }
      } catch (e) {
        console.error('Falha ao carregar receitas.', e);
      }
    };
    loadRecipes();
  }, []);

  // Salvar receitas sempre que mudar
  useEffect(() => {
    const saveRecipes = async () => {
      try {
        await Storage.setItem('@recipes', JSON.stringify(recipes));
      } catch (e) {
        console.error('Falha ao salvar receitas.', e);
      }
    };
    saveRecipes();
  }, [recipes]);

  const handleAddOrEditRecipe = () => {
    if (!title.trim()) return;

    if (editingId) {
      // Atualizar receita existente
      setRecipes((current) =>
        current.map((r) =>
          r.id === editingId
            ? { ...r, title, ingredients, preparationMethod }
            : r
        )
      );
      setEditingId(null);
    } else {
      // Nova receita
      const newRecipe = {
        id: Date.now().toString(),
        title: title.trim(),
        ingredients: ingredients.trim(),
        preparationMethod: preparationMethod.trim(),
      };
      setRecipes((current) => [...current, newRecipe]);
    }

    setTitle('');
    setIngredients('');
    setPreparationMethod('');
    setView('lista');
  };

  // Função de excluir com confirmação (funciona no web e mobile)
  const handleDeleteRecipe = (id, title) => {
    if (Platform.OS === "web") {
      // 🚀 No navegador
      const confirmDelete = window.confirm(
        `Você tem certeza que deseja excluir a receita "${title}"?`
      );
      if (confirmDelete) {
        setRecipes((current) => current.filter((r) => r.id !== id));
      }
    } else {
      // 📱 No Android/iOS
      Alert.alert(
        "Excluir Receita",
        `Você tem certeza que deseja excluir a receita "${title}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              setRecipes((current) => current.filter((r) => r.id !== id));
            }
          }
        ]
      );
    }
  };

  const handleEditRecipe = (recipe) => {
    setTitle(recipe.title);
    setIngredients(recipe.ingredients);
    setPreparationMethod(recipe.preparationMethod);
    setEditingId(recipe.id);
    setView('formulario');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Meu Livro de Receitas</Text>

        {view === 'lista' ? (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setView('formulario')}
            >
              <Text style={styles.buttonText}>Adicionar Nova Receita</Text>
            </TouchableOpacity>

            {recipes.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma receita cadastrada.</Text>
            ) : (
              recipes.map((item) => (
                <View key={item.id} style={styles.recipeItem}>
                  <View style={styles.recipeTextContainer}>
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                    <Text style={styles.recipeIngredients}>
                      Ingredientes: {item.ingredients}
                    </Text>
                    <Text style={styles.recipeMethod}>
                      Preparo: {item.preparationMethod}
                    </Text>
                  </View>

                  <View>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditRecipe(item)}
                    >
                      <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteRecipe(item.id, item.title)}
                    >
                      <Text style={styles.buttonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formHeader}>
              {editingId ? 'Editar Receita' : 'Adicionar Receita'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título da Receita"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ingredientes"
              value={ingredients}
              onChangeText={setIngredients}
              multiline={true}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Modo de Preparo"
              value={preparationMethod}
              onChangeText={setPreparationMethod}
              multiline={true}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setTitle('');
                  setIngredients('');
                  setPreparationMethod('');
                  setEditingId(null);
                  setView('lista');
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={handleAddOrEditRecipe}
              >
                <Text style={styles.buttonText}>
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#e67e22',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  formHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderColor: '#bdc3c7',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  recipeItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recipeIngredients: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  recipeMethod: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 5,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundgitColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 18,
    color: '#95a5a6',
  },
});
