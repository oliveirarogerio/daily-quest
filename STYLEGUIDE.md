Guia de Estilo: Vue.js & Tailwind CSS para Apps de TDAH
Este guia estabelece as diretrizes de design e desenvolvimento para a criação de interfaces de usuário (UI) focadas em crianças com Transtorno do Déficit de Atenção e Hiperatividade (TDAH). A abordagem combina a reatividade do Vue.js com a utilidade e o minimalismo do Tailwind CSS, garantindo uma experiência de usuário (UX) coesa e sem distrações.

1. Princípios de Design Fundamentais
   Nossa filosofia de design é baseada na neurobiologia do TDAH, priorizando:

Minimalismo: A cada passo, pergunte: "Isso é essencial?". Reduza a quantidade de informações e elementos visuais por tela.

Intenção: Cada elemento na tela deve ter um propósito claro e direto. Se não tiver, deve ser removido.

Controle: O usuário (criança) deve sentir que tem controle sobre a interface, com opções claras e previsíveis.

2. Paleta de Cores
   A paleta de cores foi escolhida para ser suave, calmante e não agressiva. Evitamos cores primárias vibrantes e saturação elevada, que podem causar sobrecarga sensorial.

Paleta Principal (Tailwind)
primary: sky-400 (ex: Botões de ação principal)

secondary: indigo-300 (ex: Elementos de progresso)

success: emerald-500 (ex: Feedback positivo)

danger: rose-500 (ex: Alertas de erro)

background: slate-100 (ex: Plano de fundo principal)

surface: white (ex: Cards e contêineres)

text: slate-700 (ex: Textos principais)

text-secondary: slate-400 (ex: Textos secundários ou de ajuda)

Exemplo de Configuração no tailwind.config.js:

JavaScript

module.exports = {
theme: {
extend: {
colors: {
'primary': '#38B2AC', // `sky-400`
'secondary': '#A0AEC0', // `indigo-300`
'success': '#10B981', // `emerald-500`
'danger': '#F43F5E', // `rose-500`
'bg-calm': '#F1F5F9', // `slate-100`
'surface-light': '#FFFFFF',
'text-main': '#374151', // `slate-700`
},
},
},
} 3. Tipografia
A tipografia deve ser simples, legível e consistente. Priorize fontes sem serifa para maior clareza.

Fonte Primária: Inter ou Poppins (Google Fonts).

Classes de Tamanho (Tailwind):

Títulos: text-2xl (h1), text-xl (h2) - Use para títulos de página e seções.

Corpo de Texto: text-base ou text-lg - Use para a maioria dos textos.

Legendas: text-sm ou text-xs - Use para informações secundárias.

Atributos Adicionais: Use font-semibold para títulos e font-regular para o corpo de texto. Evite itálico e negrito excessivos.

Exemplo de Componente Vue (Heading.vue):

Snippet de código

<template>
  <h1 :class="`font-semibold ${sizeClass} text-text-main`">
    <slot></slot>
  </h1>
</template>

<script setup>
const props = defineProps({
  sizeClass: {
    type: String,
    default: 'text-2xl',
  },
});
</script>

4. Componentes UI Reutilizáveis
   A reatividade do Vue.js é perfeita para criar componentes reutilizáveis que garantem consistência e controle.

4.1. Cards e Contêineres
Estilo: Use bg-surface-light shadow-sm rounded-lg p-4. Evite sombras pesadas ou bordas complexas.

Componente Vue (TaskCard.vue):

Um componente simples que recebe task como prop e renderiza o nome, pontos e um botão de conclusão.

Quando o botão é clicado, ele emite um evento (@click="$emit('complete', task.id)").

4.2. Botões
Estilo: Use classes como bg-primary text-white font-bold py-2 px-4 rounded-full.

Variações:

Primário: bg-primary (para ações principais como "Completar Tarefa").

Secundário/Link: text-primary font-semibold (para navegação ou ações menos importantes).

Componente Vue (BaseButton.vue):

Recebe o tipo (primary, secondary) como prop.

Emite um evento de clique.

4.3. Feedback e Animações
Feedback: Animações devem ser curtas, diretas e com propósito.

Exemplo: Ao completar uma tarefa, use uma transição suave e um componente de feedback positivo que aparece por 2-3 segundos e desaparece.

Implementação em Vue/Tailwind:

Use a transição do Vue (<Transition>) com classes do Tailwind como fade-in ou scale-up.

transition-all, duration-300, ease-in-out para suavizar as mudanças de estado.

Exemplo:

Snippet de código

<template>
  <Transition name="fade-in-scale">
    <div v-if="isComplete" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-success text-white p-6 rounded-full shadow-lg">
        <p class="text-xl">Parabéns!</p>
      </div>
    </div>
  </Transition>
</template>
5. Estrutura e Layout
5.1. Layouts Limpos
Grid e Flexbox (Tailwind): Use classes como grid, flex, gap-4 para organizar elementos de forma previsível.

Componente Vue de Layout (AppLayout.vue):

Um componente de layout principal que define a estrutura de todas as páginas (cabeçalho, conteúdo principal, rodapé opcional).

Isso garante consistência em toda a aplicação.

5.2. Navegação Consistente
A navegação deve ser simples e ter poucos itens. Um menu lateral ou uma barra inferior com ícones claros são as melhores opções.

Use vue-router para gerenciar a navegação de forma declarada.

6. Personalização (Controle do Usuário)
   As opções de personalização são cruciais para dar controle à criança.

6.1. Temas de Cores
Implemente a capacidade de alternar entre um tema claro e um tema escuro.

Implementação (Tailwind): Use a diretiva @apply para criar classes de tema. Por exemplo, .theme-calm e .theme-dark.

O estado do tema pode ser gerenciado com localStorage e Vuex ou Pinia.

6.2. Desativar Animações e Sons
Crie um botão de configuração (na área do responsável) para desativar todas as animações e sons.

Use uma variável reativa (disableAnimations) global que é verificada antes de renderizar qualquer animação ou tocar um som.

7. Boas Práticas de Código Vue.js
   Componentes de Propósito Único: Cada componente Vue.js deve fazer uma única coisa bem feita (ex: um componente TaskCard.vue, um LevelBar.vue).

Composição de Funções (Composition API): Use a Composition API para agrupar funcionalidades relacionadas, tornando o código mais legível e escalável.

Gerenciamento de Estado: Use uma biblioteca como Pinia para gerenciar o estado global da aplicação (ex: pontuação do usuário, tarefas, configurações de tema).

Propriedades e Eventos: Comunique entre componentes usando props (pai para filho) e eventos ($emit) (filho para pai).
