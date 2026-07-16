<script setup lang="ts">
import katex from 'katex'

const math = (source: string) => katex.renderToString(source, {
  displayMode: false,
  throwOnError: false,
})

const formulas = {
  cyclo: String.raw`\text{Cyclotomic squaring}`,
  gsArrow: String.raw`\xrightarrow{\text{Granger--Scott}}`,
  cost: String.raw`3S_4`,
  hybridArrow: String.raw`\xrightarrow{\text{hybrid vectorization}}`,
  tuples: String.raw`\left\{\begin{array}{l}(2,2,2,1),\ (2,1,4,1),\\(1,2,2,2),\ (1,1,4,2)\end{array}\right.`,
  decompArrow: String.raw`\xrightarrow{\mathbb{F}_{p^2}\text{ decomposition}}`,
  kernels: String.raw`\texttt{MUL\_FP\_8WAY},\ \texttt{MUL\_FP\_4x2WAY}`,
  ifmaArrow: String.raw`\xrightarrow{48\text{-bit limbs + IFMA}}`,
  products: String.raw`\text{double-length products}`,
  lazyArrow: String.raw`\xrightarrow{\text{lazy reduction}}`,
  output: String.raw`\text{cyclotomic-squaring output.}`,
}
</script>

<template>
  <div class="algebra-to-ifma">
    <div class="ifma-row">
      <div class="ifma-node ifma-cyclo" v-html="math(formulas.cyclo)" />
      <div class="ifma-arrow" v-html="math(formulas.gsArrow)" />
      <div class="ifma-node ifma-cost" v-html="math(formulas.cost)" />
    </div>

    <div class="ifma-row ifma-lower">
      <div></div>
      <div class="ifma-arrow" v-html="math(formulas.hybridArrow)" />
      <div class="ifma-node ifma-tuples" v-html="math(formulas.tuples)" />
    </div>

    <div class="ifma-lower">
      <div></div>
      <div class="ifma-arrow" v-html="math(formulas.decompArrow)" />
      <div class="ifma-node ifma-kernels" v-html="math(formulas.kernels)" />
    </div>

    <div class="ifma-lower">
      <div></div>
      <div class="ifma-arrow" v-html="math(formulas.ifmaArrow)" />
      <div class="ifma-node" v-html="math(formulas.products)" />
    </div>

    <div class="ifma-lower">
      <div></div>
      <div class="ifma-arrow" v-html="math(formulas.lazyArrow)" />
      <div class="ifma-node" v-html="math(formulas.output)" />
    </div>
  </div>
</template>

<style scoped>
.algebra-to-ifma {
  margin-top: 1.15rem;
  margin-left: 4rem;
  width: 760px;
  display: grid;
  row-gap: 0.85rem;
}

.ifma-row,
.ifma-lower {
  display: grid;
  align-items: center;
  grid-template-columns: 220px 210px 280px;
  column-gap: 0.35rem;
}

.ifma-node {
  font-size: 1.26rem;
  line-height: 1.15;
  white-space: nowrap;
}

.ifma-arrow {
  text-align: center;
  font-size: 1.05rem;
  white-space: nowrap;
}

.ifma-cyclo {
  text-align: left;
  font-size: 1.2rem;
}

.ifma-cost {
  text-align: left;
}

.ifma-tuples {
  font-size: 1rem;
}

.ifma-kernels {
  font-size: 0.98rem;
}

</style>
