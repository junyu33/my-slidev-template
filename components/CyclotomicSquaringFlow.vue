<script setup lang="ts">
import katex from 'katex'

const props = withDefaults(defineProps<{ focus?: string }>(), {
  focus: '',
})

const red = (part: string) => props.focus === part ? 'is-focused' : ''
const math = (source: string) => katex.renderToString(source, {
  displayMode: true,
  throwOnError: false,
})

const formulas = {
  finalExponentiation: String.raw`\boxed{\begin{aligned}&f\in \mathbb{F}_{p^{12}}^{*}\\&f^{(p^{12}-1)/r}=\left(f^{(p^6-1)(p^2+1)}\right)^{(p^4-p^2+1)/r}\end{aligned}}`,
  easyArrow: String.raw`\underbrace{\Downarrow}_{\text{easy part}}`,
  easyResult: String.raw`\boxed{\begin{aligned}g&=f^{(p^6-1)(p^2+1)}\\g&\in G_{\Phi_6}(\mathbb{F}_{p^2}),\qquad g^{p^4-p^2+1}=1\end{aligned}}`,
  hardArrow: String.raw`\underbrace{\Downarrow}_{\text{hard part：反复平方}}`,
  grangerScott: String.raw`\boxed{\begin{aligned}g&=a+bw+cw^2,\qquad a,b,c\in \mathbb{F}_{p^4}\\g^2&=A+Bw+Cw^2\\A&=3a^2-2\bar a\\B&=3c^2v+2\bar b,\qquad C=3b^2-2\bar c\end{aligned}}`,
  grangerArrow: String.raw`\underbrace{\Downarrow}_{\text{Granger--Scott}}`,
  costArrow: String.raw`\underbrace{\Downarrow}_{\text{three }\mathbb{F}_{p^4}\text{ squarings}}`,
  cost: String.raw`\boxed{\text{主要成本}=a^2+b^2+c^2=3S_4=6S_2+3M_2}`,
  hybridArrow: String.raw`\underbrace{\Downarrow}_{\text{hybrid vectorization}}`,
  hybrid: String.raw`\boxed{\begin{aligned}A&:\quad(1\times2\times2\times2)\text{-way}\\(B,C)&:\quad(2\times2\times2\times1)\text{-way}\end{aligned}}`,
  ifmaArrow: String.raw`\underbrace{\Downarrow}_{\text{IFMA / 48-bit limb}}`,
  ifma: String.raw`\boxed{\begin{aligned}x\in \mathbb{F}_p:\qquad x&=\sum_{i=0}^{7}x_i2^{48i}\\&8\text{ 个 }48\text{-bit limbs}\\&\texttt{vpmadd52luq/huq}\\&8\text{ 路 }52\times52\text{-bit fused multiply-add}\end{aligned}}`,
}
</script>

<template>
  <div class="cyclo-flow">
    <div class="cyclo-card cyclo-left" :class="red('easy')" style="top: 0" v-html="math(formulas.finalExponentiation)" />
    <div class="cyclo-arrow cyclo-left" :class="red('easy')" style="top: 83px; height: 38px" v-html="math(formulas.easyArrow)" />
    <div class="cyclo-card cyclo-left" :class="red('hard')" style="top: 142px" v-html="math(formulas.easyResult)" />
    <div class="cyclo-arrow cyclo-left" :class="red('hard')" style="top: 215px; height: 38px" v-html="math(formulas.hardArrow)" />
    <div class="cyclo-card cyclo-left" :class="red('granger-scott')" style="top: 270px" v-html="math(formulas.grangerScott)" />
    <div class="cyclo-arrow cyclo-left" :class="red('granger-scott')" style="top: 410px; height: 38px" v-html="math(formulas.grangerArrow)" />
    <div class="cyclo-card cyclo-right" :class="red('cost')" style="top: 0" v-html="math(formulas.cost)" />
    <div class="cyclo-arrow cyclo-right" :class="red('cost')" style="top: 46px; height: 38px" v-html="math(formulas.costArrow)" />
    <div class="cyclo-card cyclo-right" :class="red('hybrid')" style="top: 95px" v-html="math(formulas.hybrid)" />
    <div class="cyclo-arrow cyclo-right" :class="red('hybrid')" style="top: 160px; height: 38px" v-html="math(formulas.hybridArrow)" />
    <div class="cyclo-card cyclo-right" :class="red('ifma')" style="top: 205px" v-html="math(formulas.ifma)" />
    <div class="cyclo-arrow cyclo-right" :class="red('ifma')" style="top: 390px; height: 38px" v-html="math(formulas.ifmaArrow)" />
  </div>
</template>

<style scoped>
.cyclo-flow {
  position: relative;
  height: 520px;
  margin-top: 0.15rem;
  font-size: 1.11rem;
  line-height: 1.08;
}
.cyclo-flow :deep(.katex-display) { margin: 0; }
.cyclo-card, .cyclo-arrow { position: absolute; }
.cyclo-left { left: 0; width: 48%; }
.cyclo-right { left: 48%; width: 52%; }
.cyclo-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1rem;
  line-height: 1;
}
.is-focused { color: #dc2626; }
</style>
