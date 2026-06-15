/* Physics Dark Room - Web App build
   Converted from the WeChat Mini Program version.
*/

const webStorage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

function showOverlay({ title = '', content = '', buttons = [] }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = 'modal-box';
  if (title) {
    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = title;
    box.appendChild(h);
  }
  if (content) {
    const p = document.createElement('div');
    p.className = 'modal-content';
    p.textContent = content;
    box.appendChild(p);
  }
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  buttons.forEach((button) => {
    const b = document.createElement('button');
    b.className = button.primary ? 'modal-button primary' : 'modal-button';
    b.textContent = button.text;
    b.addEventListener('click', () => {
      root.innerHTML = '';
      if (button.onClick) button.onClick();
    });
    actions.appendChild(b);
  });
  box.appendChild(actions);
  overlay.appendChild(box);
  root.appendChild(overlay);
}

const wx = {
  getStorageSync(key) { return webStorage.get(key); },
  setStorageSync(key, value) { webStorage.set(key, value); },
  removeStorageSync(key) { webStorage.remove(key); },
  showModal({ title, content, confirmText = 'OK', success }) {
    showOverlay({
      title,
      content,
      buttons: [{ text: confirmText, primary: true, onClick: () => success && success({ confirm: true }) }]
    });
  },
  showActionSheet({ itemList = [], success }) {
    showOverlay({
      title: document.body.dataset.lang === 'en' ? 'Restart Options' : '重新开始',
      buttons: itemList.map((text, index) => ({
        text,
        primary: index === 0,
        onClick: () => success && success({ tapIndex: index })
      })).concat([{ text: document.body.dataset.lang === 'en' ? 'Cancel' : '取消' }])
    });
  }
};

let miniProgramPage = null;
function Page(config) {
  miniProgramPage = config;
}

const STORAGE_KEY = 'physics_darkroom_newton_game_v2'

const MAX_FOCUS = 4

function text(zh, en) {
  return { zh, en }
}

function pick(value, lang) {
  if (typeof value === 'string') return value
  return value[lang] || value.zh
}

const UI = {
  reset: text('重新开始', 'Restart'),
  resetChapter: text('重开本章节', 'Restart Chapter'),
  resetAll: text('完全重新开始', 'Restart All'),
  lang: text('English', '中文'),
  concepts: text('已建立的概念', 'Discovered Concepts'),
  log: text('记录', 'Journal'),
  complete: text('完成', 'Complete'),
  day: text('', 'Round '),
  roundSuffix: text('轮', ''),
  kinds: {
    theory: text('判断', 'Theory'),
    experiment: text('实验', 'Experiment'),
    misconception: text('判断', 'Misconception'),
    rest: text('休整', 'Rest')
  },
  resources: {
    focus: text('精力', 'Focus'),
    records: text('记录', 'Notes'),
    insight: text('思路', 'Insight'),
    predictions: text('预言', 'Predictions'),
    doubt: text('疑问', 'Doubt')
  },
  completeTitle: text('物理学的发展之路', 'The Path of Physics Development'),
  completeScene: text(
    '暗室不再只是暗室。桌上有小车、磁针、灯丝、热机、棱镜、原子核和一张写满概率的纸。',
    'The dark room is no longer merely dark. On the table lie carts, a compass, a filament, a heat engine, a prism, a nucleus, and a page covered in probability.'
  ),
  completeGoal: text(
    '你走完了一条物理史主线：从苹果和月亮，到电机、无线电、热、声、光、时空、量子和核能。最后的问题不再是“能不能做到”，而是“该怎样使用”。',
    'You have followed one central path through physics: from the apple and the Moon to motors, radio, heat, sound, light, spacetime, quanta, and nuclear energy. The final question is no longer whether it can be done, but how it should be used.'
  )
}

const START_STATE = {
  lang: 'zh',
  chapter: 0,
  focus: MAX_FOCUS,
  day: 1,
  records: 0,
  insight: 0,
  doubt: 1,
  predictions: 0,
  facts: {},
  laws: {},
  complete: false,
  feedback: null,
  logs: [
    {
      time: 0,
      text: text(
        '窗外啪嗒一声。苹果落地，月亮还挂在天上。桌上的小车像在等你发问。',
        'Outside, an apple drops to the ground. The Moon still hangs overhead. The little cart on the table seems to be waiting for your question.'
      )
    }
  ]
}

const CHAPTERS = [
  {
    title: text('落体与惯性', 'Falling Bodies and Inertia'),
    label: text('第一问', 'Q1'),
    question: text(
      '苹果会落下。问题不是“它落下了”，而是：运动会不会自己改变？',
      'An apple falls. The question is not simply that it falls. The real question is whether motion changes on its own.'
    ),
    scene: text(
      '苹果落得太快了，什么都看不清。你得想办法让运动慢下来，仔细观察，再从中发现“物体倾向于保持原来的运动状态”这个规律。',
      'The apple falls too fast to observe. Slow the motion down, observe carefully, and discover the rule: objects tend to keep their current state of motion.'
    )
  },
  {
    title: text('力与质量', 'Force, Mass, and Acceleration'),
    label: text('第二问', 'Q2'),
    question: text(
      '如果物体会保持原状，那么力到底改变了什么？质量又为什么重要？',
      'If objects tend to keep their state of motion, what exactly does a force change? And why does mass matter?'
    ),
    scene: text(
      '一辆小车在桌面上滑动。用不同的力推它，或者换一辆更重的小车，运动的改变方式都不一样。你需要找到力、质量和加速度之间的关系。',
      'A cart slides across the table. Push it with different forces, or swap in a heavier cart — the motion changes in different ways. Find the relationship between force, mass, and acceleration.'
    )
  },
  {
    title: text('相互作用', 'Action and Reaction'),
    label: text('第三问', 'Q3'),
    question: text(
      '一个物体推另一个物体时，力是单向的吗？',
      'When one object pushes another, is the force only one-way?'
    ),
    scene: text(
      '两辆小车面对面。让它们碰撞，或者用弹簧连在一起拉开。你会发现：力从来不是单方面的，一个物体施加力，必然同时受到另一个物体的反作用力。',
      'Two carts face each other. Crash them together, or connect them with a spring and pull them apart. You will find: forces always come in pairs — when one object pushes, it is pushed back.'
    )
  },
  {
    title: text('月亮为什么一直落不下来', 'Why Does the Moon Keep Missing Earth?'),
    label: text('第四问', 'Q4'),
    question: text(
      '苹果落向地面，月亮却绕着地球。它们可能是同一种运动吗？',
      'The apple falls toward Earth, and the Moon circles Earth. Could both be forms of falling?'
    ),
    scene: text(
      '你已经在地面上找到了运动的规律。现在抬头看天——月亮一直在“掉”，却永远掉不到地上。用你已有的知识，去解释天上的运动。',
      'You have found the laws of motion on the ground. Now look up: the Moon is always "falling" but never hits Earth. Use what you already know to explain motion in the heavens.'
    )
  },
  {
    title: text('写成原理', 'Writing the Principles'),
    label: text('收束', 'Closure'),
    question: text(
      '现在，地上的运动和天上的运动能否共用一套语言？',
      'Can motion on Earth and motion in the heavens be described by the same laws?'
    ),
    scene: text(
      '你的暗室里已经积累了不少实验记录和想法。是时候把它们整理成一套完整的理论了——用几条简洁的定律，统一描述天上和地上的所有运动。',
      'Your dark room now holds many experiments and ideas. Time to organize them into a complete theory — a few simple laws that describe all motion, on Earth and in the sky.'
    )
  },
  {
    title: text('看不见的吸引', 'Invisible Electric Attraction'),
    label: text('第五问', 'Q5'),
    question: text(
      '琥珀摩擦之后会吸起纸屑。这是力吗？如果是，为什么不用接触也能发生？',
      'After amber is rubbed, it attracts scraps of paper. Is this a force? If so, how can it act without contact?'
    ),
    scene: text(
      '桌上出现了琥珀、毛皮和纸屑。你刚刚理解了引力和接触力，现在又遇到一种全新的力——不需要接触，隔着空气就能起作用。这是怎么回事？',
      'Amber, fur, and paper scraps appear on the table. You just understood gravity and contact forces, and now a new kind of force appears — it works through the air without touching. What is going on?'
    )
  },
  {
    title: text('电流与磁针', 'Current and the Compass'),
    label: text('第六问', 'Q6'),
    question: text(
      '电流经过导线时，旁边的磁针会偏转。电和磁真的互不相干吗？',
      'When current flows through a wire, a nearby compass needle turns. Are electricity and magnetism really separate?'
    ),
    scene: text(
      '桌上有一节电池、一根导线和一枚指南针。把导线接通，看看旁边的磁针会不会动。如果动了，说明电和磁之间有某种联系。',
      'A battery, a wire, and a compass needle sit on the table. Connect the wire to the battery and watch the compass — if the needle moves, electricity and magnetism are connected.'
    )
  },
  {
    title: text('线圈里的电', 'Current in the Coil'),
    label: text('第七问', 'Q7'),
    question: text(
      '磁铁不接触线圈，却能让感应电流出现。到底是磁铁本身，还是变化在起作用？',
      'A magnet can induce a current in a coil without touching it. Is the magnet itself enough, or is change the key?'
    ),
    scene: text(
      '线圈安静地放在那里。把磁铁插进去、拔出来——电流表的指针跳动了。磁铁不动的时候什么也不发生，只有变化才能产生电。',
      'A coil sits quietly. Push a magnet in, pull it out — the meter needle jumps. When the magnet stays still, nothing happens. Only change creates electricity.'
    )
  },
  {
    title: text('场与光', 'Fields and Light'),
    label: text('第八问', 'Q8'),
    question: text(
      '如果变化的电场能产生磁场，变化的磁场能产生电场，那么它们会不会一起向外传播？',
      'If a changing electric field can produce a magnetic field, and a changing magnetic field can produce an electric field, can the two propagate outward together?'
    ),
    scene: text(
      '你已经知道电生磁、磁生电。现在把这两条规律放在一起：变化的电场产生磁场，变化的磁场又产生电场……它们互相激发，会不会像波浪一样传播出去？',
      'You already know electricity creates magnetism and magnetism creates electricity. Now put them together: a changing electric field makes a magnetic field, which makes an electric field... Could they ripple outward like a wave?'
    )
  },
  {
    title: text('电的机器', 'Electrical Machines'),
    label: text('第九问', 'Q9'),
    question: text(
      '如果电流能产生磁效应，变化的磁场能感应电流，能不能让它们替人做功？',
      'If electric currents can produce magnetic effects, and changing magnetic fields can induce currents, can we make them do useful work?'
    ),
    scene: text(
      '你手上有线圈、铁芯和磁铁。把它们组合起来：让电流转动电机，或者让转动的磁铁发出电来。电磁学不只是理论，它可以驱动机器、点亮灯泡。',
      'You have coils, iron cores, and magnets. Combine them: use current to spin a motor, or spin a magnet to generate electricity. Electromagnetism is not just theory — it can drive machines and light lamps.'
    )
  },
  {
    title: text('无线电', 'Radio Communication'),
    label: text('第十问', 'Q10'),
    question: text(
      '麦克斯韦说电磁波会传播。它能不能离开导线，把消息带到远处？',
      'Maxwell’s theory says electromagnetic waves can travel. Can they leave a wire and carry messages across distance?'
    ),
    scene: text(
      '电磁波已经被预言存在了。现在你要用火花放电产生它，再用天线接收它。如果能成功，信息就可以不用电线，直接穿过空气传到远方。',
      'Electromagnetic waves have been predicted. Now generate them with a spark, and detect them with an antenna. If it works, messages can travel through the air without wires.'
    )
  },
  {
    title: text('热与功', 'Heat and Work'),
    label: text('第十一问', 'Q11'),
    question: text(
      '蒸汽能推动活塞。热到底是一种东西，还是运动和能量的另一种面孔？',
      'Steam can push a piston. Is heat a substance, or is it another face of motion and energy?'
    ),
    scene: text(
      '烧水产生蒸汽，蒸汽推动活塞——热变成了机械运动。但热到底是什么？是一种流动的“热质”，还是能量的一种形式？你需要用实验来回答。',
      'Boil water to make steam, and steam pushes a piston — heat becomes mechanical motion. But what is heat? A fluid-like substance, or a form of energy? You need experiments to decide.'
    )
  },
  {
    title: text('熵与方向', 'Entropy and the Arrow of Time'),
    label: text('第十二问', 'Q12'),
    question: text(
      '能量守恒了，为什么热机还是会浪费？为什么时间好像只往一个方向流？',
      'If energy is conserved, why do heat engines still waste energy as heat? And why does time seem to have only one direction?'
    ),
    scene: text(
      '能量不会凭空消失，但热机永远不能把热全部变成功。总有一部分热量散失到环境中。这背后有一个更深的规律——熵总是在增加，它决定了时间的方向。',
      'Energy is never destroyed, but no engine can turn all heat into work. Some heat always escapes. Behind this is a deeper law: entropy always increases, and it gives time its direction.'
    )
  },
  {
    title: text('声音的形状', 'The Shape of Sound'),
    label: text('第十三问', 'Q13'),
    question: text(
      '声音会不会也是一种波？如果是，波动的究竟是什么？',
      'Could sound be a wave too? If so, what is actually vibrating?'
    ),
    scene: text(
      '敲一下音叉，听到声音。但声音是怎么传到耳朵里的？用实验证明声音是空气的振动——它需要介质，有频率和波长，和水波、电磁波一样遵循波的规律。',
      'Strike a tuning fork and hear the sound. But how does it reach your ear? Prove with experiments that sound is vibration traveling through air — it needs a medium, has frequency and wavelength, and follows wave laws.'
    )
  },
  {
    title: text('光的路', 'The Path of Light'),
    label: text('第十四问', 'Q14'),
    question: text(
      '光会折射、成像、分色、干涉。它是粒子、波，还是更奇怪的东西？',
      'Light refracts, forms images, disperses into colors, and interferes. Is it made of particles, waves, or something stranger?'
    ),
    scene: text(
      '用棱镜把白光分成彩虹，用透镜把远景拉到眼前，再用双缝实验看光的干涉条纹。光的行为有时候像粒子，有时候像波——你得把两种证据都收集起来。',
      'Split white light into a rainbow with a prism, bring distant scenes close with a lens, and see interference fringes with a double slit. Light sometimes acts like particles, sometimes like waves — collect evidence for both.'
    )
  },
  {
    title: text('追不上光', 'Chasing a Beam of Light'),
    label: text('第十五问', 'Q15'),
    question: text(
      '如果你追着一束光跑，会不会看到一束静止的光？',
      'If you chase a beam of light, could you ever see it frozen in place?'
    ),
    scene: text(
      '按照常识，你跑得够快就能追上任何东西。但实验发现光速永远不变，不管你怎么追。这意味着时间和空间不是绝对的——爱因斯坦从这里开始重新思考一切。',
      'Common sense says if you run fast enough, you can catch anything. But experiments show the speed of light never changes, no matter how you chase it. This means time and space are not absolute — Einstein starts rethinking everything from here.'
    )
  },
  {
    title: text('弯曲的时空', 'Curved Spacetime'),
    label: text('第十六问', 'Q16'),
    question: text(
      '如果引力不是一只看不见的手，而是时空本身弯了呢？',
      'What if gravity is not an invisible hand, but the curvature of spacetime itself?'
    ),
    scene: text(
      '想象你在一个自由下落的电梯里，感觉不到自己的重量。爱因斯坦说：引力不是一种力，而是时空被质量弯曲后的几何效应。太阳的质量让周围的时空弯曲，行星只是沿着弯曲的路径走。',
      'Imagine falling freely in an elevator — you feel weightless. Einstein says gravity is not a force, but the curvature of spacetime caused by mass. The Sun bends spacetime around it, and planets simply follow curved paths.'
    )
  },
  {
    title: text('原子有内部', 'Inside the Atom'),
    label: text('第十七问', 'Q17'),
    question: text(
      '原子真的是不可分的硬球吗？如果不是，里面藏着什么？',
      'Is the atom truly an indivisible hard sphere? If not, what is hidden inside?'
    ),
    scene: text(
      '用阴极射线轰击原子，用α粒子去撞金箔。实验结果显示原子内部几乎是空的，中间有一个极小的核，电子在周围。原子不是不可分的——它有结构。',
      'Bombard atoms with cathode rays, shoot alpha particles at gold foil. The results show atoms are mostly empty space, with a tiny dense nucleus at the center and electrons around it. Atoms have structure.'
    )
  },
  {
    title: text('能量一份一份', 'Energy in Packets'),
    label: text('第十八问', 'Q18'),
    question: text(
      '热辐射和金属表面的电子都不肯按经典物理行动。能量会不会不是连续的？',
      'Thermal radiation and the photoelectric effect refuse to obey classical physics. Could energy come in discrete packets?'
    ),
    scene: text(
      '烧红的铁块发出特定颜色的光，紫外光照在金属上会打出电子。经典物理无法解释这些现象。普朗克和爱因斯坦提出一个大胆的想法：能量不是连续的，而是一份一份的“量子”。',
      'A hot iron glows with specific colors, and ultraviolet light knocks electrons off metal. Classical physics cannot explain this. Planck and Einstein propose a bold idea: energy is not continuous, but comes in discrete packets — "quanta".'
    )
  },
  {
    title: text('概率的原子', 'Atoms and Probability'),
    label: text('第十九问', 'Q19'),
    question: text(
      '电子到底在哪里？它是绕核转的小行星，还是一团只能计算概率的波？',
      'Where exactly is the electron? Is it a tiny planet orbiting the nucleus, or a wave described by probability?'
    ),
    scene: text(
      '电子不像行星那样有确定的轨道。你只能算出它在某个位置出现的概率。物质同时具有粒子和波的性质，原子世界由概率和不确定性支配——这彻底改变了我们对“实在”的理解。',
      'Electrons do not have definite orbits like planets. You can only calculate the probability of finding one at a given position. Matter has both particle and wave nature, and the atomic world is ruled by probability and uncertainty — this changes our understanding of reality itself.'
    )
  },
  {
    title: text('核火', 'Nuclear Fire'),
    label: text('第二十问', 'Q20'),
    question: text(
      '如果原子核也能改变，释放出来的能量会把世界带到哪里？',
      'If atomic nuclei can change too, where will the energy they release take the world?'
    ),
    scene: text(
      '原子核里蕴藏着巨大的能量。用中子轰击铀核，它会分裂并释放更多中子，引发链式反应。这能量可以点亮城市，也可以毁灭城市——物理学走到了一个需要人类做出选择的十字路口。',
      'Enormous energy is locked inside atomic nuclei. Bombard uranium with neutrons, and it splits, releasing more neutrons in a chain reaction. This energy can light up cities or destroy them — physics arrives at a crossroads where humanity must choose.'
    )
  }
]

const ACTIONS = [
  {
    id: 'watch_apple',
    type: 'experiment',
    chapter: 0,
    label: text('观察苹果：它怎么落下来的？', 'Watch the Apple: How Does It Fall?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.apple = true
      return text(
        '苹果笔直地落向地面，没有转弯，没有犹豫。你在笔记上写下第一条观察：物体总是朝着地面运动。',
        'The apple falls straight down without turning or hesitating. You record your first observation: objects always move toward the ground.'
      )
    }
  },
  {
    id: 'compare_objects',
    type: 'experiment',
    chapter: 0,
    label: text('比较不同物体：石子、木块也这样落吗？', 'Compare: Do a Stone and a Wood Block Fall the Same Way?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.manyFall = true
      return text(
        '石子、木块、苹果——全都往下落。不是苹果特别听话，而是所有物体都受到同样的向下牵引。你开始怀疑：下落是一种普遍规律。',
        'A stone, a wooden block, and an apple all fall downward. It is not that apples are special — all objects are pulled toward the ground in the same way. You begin to suspect a universal rule.'
      )
    }
  },
  {
    id: 'build_slope',
    type: 'experiment',
    chapter: 0,
    label: text('搭一个斜面：把下落变慢，仔细看', 'Build an Inclined Plane: Slow Down the Fall'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.manyFall,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.slope = true
      return text(
        '斜面把下落拖慢了。小球在斜面上缓缓滚下，你终于能一格一格地观察运动的过程——快慢变化变得可以测量了。',
        'The inclined plane slows the fall. The ball rolls gently down the slope, and now you can observe motion step by step — the changes in speed become measurable.'
      )
    }
  },
  {
    id: 'wrong_weight',
    type: 'misconception',
    chapter: 0,
    label: text('草率下结论：重的东西落得更快？', 'Jump to a Conclusion: Heavier Objects Fall Faster?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple && !s.facts.manyFall,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：你还只看过苹果。先比较别的物体，否则“重物更快”只是顺手猜的。',
        'Counterexample: you have only watched the apple. Compare other objects first; otherwise, "heavier objects fall faster" is only a guess.'
      )
      return text(
        '你写下“重的落得更快”。但纸面很安静——你只观察了苹果，证据还不够。多比较几种物体再下结论吧。',
        'You write "heavier objects fall faster." But the page stays quiet — you have only watched the apple. Gather more evidence before drawing conclusions.'
      )
    }
  },
  {
    id: 'wrong_direction_only',
    type: 'misconception',
    chapter: 0,
    label: text('仓促推论：都往下落就够了吗？', 'Hasty Conclusion: Is Direction Enough?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.manyFall && !s.facts.slope,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：石子和木块都向下，只说明方向相同。要判断运动会不会自己改变，还得把运动放慢。',
        'Counterexample: stone and wood both fall downward, but that only tells you the direction. To judge whether motion changes on its own, you need to slow the motion down.'
      )
      return text(
        '你差点把“都向下落”当成最终答案。但方向相同只说明它们受到同样的影响——要发现运动规律，还得把运动放慢来观察。',
        'You almost treat "they all go down" as the full answer. But sharing a direction only means they are affected the same way — to find the law of motion, you need to slow things down and observe.'
      )
    }
  },
  {
    id: 'law_inertia',
    type: 'theory',
    chapter: 0,
    label: text('提出新概念：物体在不受力时，会保持静止或匀速直线运动', 'Propose: Objects at rest stay at rest; objects in motion stay in motion unless acted upon'),
    hint: text('精力1 需：斜面 记录3 思路1', 'Focus 1; requires: inclined plane, Notes 3, Insight 1'),
    cost: 1,
    requires: (s) => s.facts.slope && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.inertia = true
      s.chapter = 1
      s.feedback = null
      return text(
        '你写下第一条定律：物体在不受外力时，会保持静止或匀速直线运动。这就是惯性——运动不会自己改变，需要力来打破。',
        'You write the first law: an object at rest stays at rest, and an object in motion stays in motion with constant velocity, unless acted upon by a net external force. This is inertia — motion does not change on its own.'
      )
    }
  },
  {
    id: 'push_cart',
    type: 'experiment',
    chapter: 1,
    label: text('轻推小车：力是怎样改变运动的？', 'Nudge the Cart: How Does Force Change Motion?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.push = true
      return text(
        '你轻轻推了一下小车。它本来静止，被推之后开始运动。力不是维持运动的东西，而是改变运动的原因。',
        'You nudge the cart. It was at rest, and now it moves. Force is not what keeps things moving — it is what changes their motion.'
      )
    }
  },
  {
    id: 'wrong_push_forever',
    type: 'misconception',
    chapter: 1,
    label: text('错误直觉：物体运动必须一直有力推着？', 'Misconception: Does Motion Require Continuous Force?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：手离开后，小车仍会滑行。力也许不是“维持运动”，而是“改变运动”。',
        'Counterexample: after your hand leaves, the cart still glides. Force may not be what maintains motion; it may be what changes motion.'
      )
      return text(
        '你猜小车必须一直被推着才能动。但手松开后，它还滑行了一段才停下。这说明力不是维持运动，而是改变运动。',
        'You guess the cart needs continuous pushing to move. But after you let go, it keeps gliding. Force does not maintain motion — it changes it.'
      )
    }
  },
  {
    id: 'vary_force',
    type: 'experiment',
    chapter: 1,
    label: text('改变推力：力越大，运动变化越快吗？', 'Vary the Force: Does More Force Mean Faster Change?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.forceChange = true
      return text(
        '推得越用力，小车的速度变化越快。你在笔记里给这种“速度变化的快慢”留了一个位置——后来它叫加速度。',
        'The harder you push, the faster the speed changes. You make room in your notes for this “rate of change of speed” — later called acceleration.'
      )
    }
  },
  {
    id: 'add_mass',
    type: 'experiment',
    chapter: 1,
    label: text('给小车加重：质量大了，同样的力效果一样吗？', 'Add Mass: Does the Same Force Work the Same Way?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.mass = true
      return text(
        '给小车加上重物后，同样的推力产生的速度变化变小了。质量越大，越难改变它的运动状态——这就是惯性的大小。',
        'After adding weight, the same push produces a smaller speed change. Greater mass means harder to change its motion — this is the measure of inertia.'
      )
    }
  },
  {
    id: 'invent_calculus',
    type: 'experiment',
    chapter: 1,
    label: text('精确测量：把时间切成无限薄的瞬间', 'Slice Time: Measure Change at Each Instant'),
    hint: text('精力2 -> 思路1 预言1', 'Focus 2 -> Insight +1, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.forceChange && s.facts.mass,
    once: true,
    run(s) {
      s.insight += 1
      s.predictions += 1
      s.facts.calculus = true
      return text(
        '你把时间切成越来越薄的瞬间。速度不再只是“前后差多少”，而成了每一瞬间的精确变化率——这就是微积分的核心思想。',
        'You slice time into thinner and thinner instants. Speed is no longer just a before-and-after difference — it becomes the precise rate of change at each moment. This is the core idea of calculus.'
      )
    }
  },
  {
    id: 'wrong_average_only',
    type: 'misconception',
    chapter: 1,
    label: text('偷懒：只看平均速度够不够？', 'Shortcut: Is Average Velocity Enough?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && !s.facts.calculus,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：平均速度会把一段运动抹平。要描述力怎样改变运动，你需要看每一瞬间的变化。',
        'Counterexample: average speed smooths a whole motion into one number. To describe how force changes motion, you need the change at each instant.'
      )
      return text(
        '你试着只用平均速度来解释小车的运动。但平均速度把整个过程抹平了——要描述力怎样改变运动，你需要每一瞬间的速度变化。',
        'You try to explain the cart using only average speed. But averaging smooths out the whole process — to describe how force changes motion, you need the speed change at each instant.'
      )
    }
  },
  {
    id: 'law_second',
    type: 'theory',
    chapter: 1,
    label: text('提出新概念：力等于质量乘以加速度，F=ma', 'Propose: Force equals mass times acceleration, F=ma'),
    hint: text('精力1 需：推力 质量 微积分 记录4 思路2', 'Focus 1; requires: force, mass, calculus, Notes 4, Insight 2'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && s.facts.calculus && s.records >= 4 && s.insight >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 2
      s.laws.second = true
      s.chapter = 2
      s.feedback = null
      return text(
        '你写下第二定律：物体的加速度与所受合力成正比，与质量成反比。F=ma——力、质量和加速度被锁进同一个方程。',
        'You write the second law: the acceleration of an object is proportional to the net force and inversely proportional to its mass. F=ma — force, mass, and acceleration locked into one equation.'
      )
    }
  },
  {
    id: 'collide_carts',
    type: 'experiment',
    chapter: 2,
    label: text('碰撞实验：两辆小车相撞，各自怎么动？', 'Collision: What Happens to Both Carts?'),
    hint: text('精力2 -> 记录2', 'Focus 2 -> Notes +2'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.facts.collision = true
      return text(
        '两辆小车撞在一起。不仅被撞的车动了，撞它的那辆也被弹了回来。力不是单向的——两个物体互相施加力。',
        'Two carts collide. Not only does the struck cart move — the striking cart also bounces back. Force is not one-way; both objects exert forces on each other.'
      )
    }
  },
  {
    id: 'wrong_one_way_force',
    type: 'misconception',
    chapter: 2,
    label: text('错误直觉：力是单向的，只有一方受力？', 'Misconception: Is Force One-Sided?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.collision && !s.facts.rope,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：被撞的小车动了，撞它的小车也退了。力的箭头少画了一半。',
        'Counterexample: the struck cart moves, and the striking cart rolls back. Half the force arrows are missing.'
      )
      return text(
        '你只画了一个方向的力箭头。但撞人的小车自己也退了回来——你漏掉了反方向的箭头。力总是成对出现的。',
        'You drew the force arrow in only one direction. But the striking cart also rolled back — you missed the opposite arrow. Forces always come in pairs.'
      )
    }
  },
  {
    id: 'pull_rope',
    type: 'experiment',
    chapter: 2,
    label: text('拉绳实验：你拉绳，绳也拉你吗？', 'Pull a Rope: Does It Pull You Back?'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.rope = true
      return text(
        '你用力拉绳子，同时感觉到绳子也在拉你的手。你忽然意识到：世界从来不允许单方面动手——作用力必然伴随反作用力。',
        'You pull the rope, and feel it pulling your hand back. You realize: the world never allows one-sided action — every force comes with an equal and opposite reaction.'
      )
    }
  },
  {
    id: 'measure_pair_force',
    type: 'experiment',
    chapter: 2,
    label: text('精确测量：绳子两端的力一样大吗？', 'Measure: Are the Forces at Both Ends Equal?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.rope,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.equalPair = true
      return text(
        '你在绳子两端各接一个弹簧秤。两边读数同时抖动，最后停在完全相同的数值上——作用力和反作用力大小相等。',
        'You attach spring scales to both ends. Both readings tremble, then settle on exactly the same number — action and reaction are equal in magnitude.'
      )
    }
  },
  {
    id: 'wrong_pair_not_equal',
    type: 'misconception',
    chapter: 2,
    label: text('错误直觉：反作用力应该小一些？', 'Misconception: Is the Reaction Weaker?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.rope && !s.facts.equalPair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只知道力成对还不够。你需要比较两端大小，否则“反作用力较小”只是直觉。',
        'Counterexample: knowing forces come in pairs is not enough. Compare both ends, or "the reaction is weaker" is only intuition.'
      )
      return text(
        '你猜测反作用力也许小一些。但绳子绷得笔直——直觉不可靠，用弹簧秤量一量才知道：两端的力完全相等。',
        'You guess the reaction might be weaker. But the taut rope demands a measurement — and the scales show the forces are exactly equal.'
      )
    }
  },
  {
    id: 'law_third',
    type: 'theory',
    chapter: 2,
    label: text('提出新概念：两个物体之间的作用力与反作用力大小相等、方向相反', 'Propose: For every action there is an equal and opposite reaction'),
    hint: text('精力1 需：碰撞 拉绳 两端相等 记录5 思路1', 'Focus 1; requires: collision, rope, equal readings, Notes 5, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.equalPair,
    requires: (s) => s.facts.collision && s.facts.rope && s.facts.equalPair && s.records >= 5 && s.insight >= 1,
    run(s) {
      s.records -= 5
      s.insight -= 1
      s.laws.third = true
      s.chapter = 3
      s.feedback = null
      return text(
        '你写下第三定律：两个物体之间的作用力与反作用力总是大小相等、方向相反，作用在同一条直线上。力永远是成对的。',
        'You write the third law: for every action there is an equal and opposite reaction. Forces always come in pairs, acting on two different objects.'
      )
    }
  },
  {
    id: 'read_moon',
    type: 'experiment',
    chapter: 3,
    label: text('观察月亮：它每晚位置都在变，为什么不掉下来？', 'Study the Moon: Why Does It Not Fall to Earth?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.moon = true
      return text(
        '月亮每晚的位置都在变化，却始终绕着地球转，从不掉下来。它像一颗永远在“下落”却永远错过地面的炮弹。',
        'The Moon changes position every night, yet never falls to Earth. It is like a cannonball that keeps falling but always misses the ground.'
      )
    }
  },
  {
    id: 'wrong_moon_free',
    type: 'misconception',
    chapter: 3,
    label: text('错误直觉：月亮在天上，所以它没有在下落？', 'Misconception: The Moon Is Not Falling?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.moon,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：月亮的方向每晚都在变。它不是不下落，而是一直错过地面。',
        'Counterexample: the Moon changes direction every night. It is not refusing to fall; it keeps missing Earth.'
      )
      return text(
        '你写下“月亮没有下落”。但它的轨迹是弯的——如果不受力，它应该沿直线飞走。弯曲说明有力在拉它，就像苹果被拉向地面一样。',
        'You write "the Moon is not falling." But its path is curved — without a force, it would fly off in a straight line. The curve means something is pulling it, just like the apple is pulled to the ground.'
      )
    }
  },
  {
    id: 'estimate_curve',
    type: 'experiment',
    chapter: 3,
    label: text('计算月亮的弯曲：它每秒“掉”多少？', 'Calculate: How Much Does the Moon "Fall" Each Second?'),
    hint: text('精力2 -> 预言1 思路1', 'Focus 2 -> Prediction +1, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.moon,
    once: true,
    run(s) {
      s.predictions += 1
      s.insight += 1
      s.facts.curve = true
      return text(
        '你画出了月亮的弯曲轨迹，算出了它每秒向地球“掉落”的距离。它确实在下落，只是水平速度太快，总把地面错过去。',
        'You draw the Moon’s curved path and calculate how far it "falls" toward Earth each second. It is indeed falling — but its sideways speed is so great it keeps missing.'
      )
    }
  },
  {
    id: 'compare_earth_sky',
    type: 'experiment',
    chapter: 3,
    label: text('关键比较：苹果的下落和月亮的“下落”是同一回事吗？', 'Key Comparison: Is the Apple’s Fall the Same as the Moon’s?'),
    hint: text('精力2 -> 预言1 记录1', 'Focus 2 -> Prediction +1, Notes +1'),
    cost: 2,
    requires: (s) => s.facts.curve && s.laws.second,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.sameGravity = true
      return text(
        '你把苹果和月亮放在同一张纸上比较。苹果直直落到脚边，月亮沿着弯曲的轨道“落”。它们受的是同一种力——引力，只是速度不同导致了不同的轨迹。',
        'You compare the apple and the Moon on the same page. The apple falls straight to your feet; the Moon "falls" along a curved orbit. They are pulled by the same force — gravity — only their speeds differ, leading to different paths.'
      )
    }
  },
  {
    id: 'law_gravity',
    type: 'theory',
    chapter: 3,
    label: text('提出新概念：任何两个有质量的物体之间都存在引力，引力与距离的平方成反比', 'Propose: Every mass attracts every other mass; the force weakens with the square of distance'),
    hint: text('精力1 需：地月比较 预言2 思路1', 'Focus 1; requires: Earth–Moon comparison, Predictions 2, Insight 1'),
    cost: 1,
    requires: (s) => s.facts.sameGravity && s.predictions >= 2 && s.insight >= 1,
    run(s) {
      s.predictions -= 2
      s.insight -= 1
      s.laws.gravity = true
      s.chapter = 4
      s.feedback = null
      return text(
        '你提出万有引力定律：任何两个物体之间都存在引力，大小与质量的乘积成正比，与距离的平方成反比。同一种力，拽住苹果，也拽住月亮。',
        'You propose universal gravitation: every mass attracts every other mass, with a force proportional to the product of their masses and inversely proportional to the square of the distance. One force pulls both the apple and the Moon.'
      )
    }
  },
  {
    id: 'write_principia',
    type: 'theory',
    chapter: 4,
    label: text('集大成：把三条定律和万有引力写成完整的理论体系', 'Synthesize: Write the Three Laws and Gravity into One System'),
    hint: text('精力1 需：三定律 万有引力 记录2', 'Focus 1; requires: three laws, gravity, Notes 2'),
    cost: 1,
    requires: (s) => s.laws.inertia && s.laws.second && s.laws.third && s.laws.gravity && s.records >= 2,
    run(s) {
      s.records -= 2
      s.laws.principia = true
      s.chapter = 5
      s.feedback = null
      return text(
        '你合上《自然哲学的数学原理》。地上的碰撞、桌上的小车、天上的月亮——终于用同一套定律统一了。经典力学的大厦落成。墙后，一枚磁针悄悄偏了一下，新的问题在等待。',
        'You close the Principia. Collisions on the floor, carts on the table, and the Moon in the sky — all now described by the same laws. Classical mechanics stands complete. Behind the wall, a compass needle twitches; new questions await.'
      )
    }
  },
  {
    id: 'rub_amber',
    type: 'experiment',
    chapter: 5,
    label: text('摩擦琥珀：为什么纸屑会被吸起来？', 'Rub Amber: Why Are Paper Scraps Attracted?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.amber = true
      return text(
        '琥珀擦过毛皮后，周围的纸屑忽然竖了起来，像被一只看不见的手提起。不接触也能产生力——这是一种全新的现象。',
        'After rubbing amber with fur, nearby paper scraps stand up as if lifted by an invisible hand. A force without contact — this is something entirely new.'
      )
    }
  },
  {
    id: 'wrong_contact_only',
    type: 'misconception',
    chapter: 5,
    label: text('错误直觉：力必须通过接触才能传递？', 'Misconception: Must Forces Act Through Contact?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.amber && !s.facts.chargePair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：纸屑还没碰到琥珀就动了。这里也许有一种隔空影响。',
        'Counterexample: the paper moves before touching the amber. Some influence is reaching across space.'
      )
      return text(
        '你写下“力必须接触”。但纸屑还没碰到琥珀就动了——这里有一种隔空传递的影响，经典力学的接触模型解释不了。',
        'You write "force requires contact." But the paper moves before touching the amber — there is an influence that reaches across space, beyond the contact model of classical mechanics.'
      )
    }
  },
  {
    id: 'compare_charges',
    type: 'experiment',
    chapter: 5,
    label: text('比较两种效果：有的吸、有的斥，为什么？', 'Compare: Some Attract, Some Repel — Why?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.amber,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.chargePair = true
      return text(
        '有些带电物体互相吸引，有些互相排斥。电不只是“吸引”，它有两种相反的效应——这说明电有两种类型，后来叫正电荷和负电荷。',
        'Some charged objects attract, others repel. Electricity is not just attraction — it has two opposite effects. This suggests two types of charge, later called positive and negative.'
      )
    }
  },
  {
    id: 'law_charge',
    type: 'theory',
    chapter: 5,
    label: text('提出新概念：电荷有两种，同种相斥、异种相吸', 'Propose: There are two kinds of electric charge; like repels, unlike attracts'),
    hint: text('精力1 需：吸引排斥 记录3 思路1', 'Focus 1; requires: attraction and repulsion, Notes 3, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.chargePair,
    requires: (s) => s.facts.chargePair && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.charge = true
      s.chapter = 6
      s.feedback = null
      return text(
        '你给这种隔空作用的电性起了名字：电荷。同种电荷互相排斥，异种电荷互相吸引。暗室里多了一种看不见但可以精确描述的秩序。',
        'You name this electric property: charge. Like charges repel, unlike charges attract. Another invisible but precisely describable order enters the room.'
      )
    }
  },
  {
    id: 'close_circuit',
    type: 'experiment',
    chapter: 6,
    label: text('接通电路：导线里有什么在流动？', 'Connect the Circuit: What Flows Inside the Wire?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.current = true
      return text(
        '导线接上电池，金属没有发光发热，但你感觉到有东西在里面持续流动——这就是电流，电荷在导线中的定向移动。',
        'The wire is connected to the battery. The metal does not glow, but you sense something flowing continuously inside — this is electric current, the directed movement of charge through the wire.'
      )
    }
  },
  {
    id: 'compass_near_wire',
    type: 'experiment',
    chapter: 6,
    label: text('关键实验：通电导线旁边的磁针会动吗？', 'Key Experiment: Does Current Affect a Compass?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.current,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.oersted = true
      return text(
        '电流通过导线时，旁边的磁针偏转了！电和磁不是互不相干——电流能产生磁效应。这是奥斯特的伟大发现：电和磁是联系在一起的。',
        'When current flows, the compass needle turns! Electricity and magnetism are not separate — electric current produces magnetic effects. This is Ørsted’s great discovery: electricity and magnetism are connected.'
      )
    }
  },
  {
    id: 'wrong_electric_magnetic_separate',
    type: 'misconception',
    chapter: 6,
    label: text('错误直觉：电和磁是两回事，互不相干？', 'Misconception: Are Electricity and Magnetism Unrelated?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.current && !s.facts.oersted,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：先别急着分开它们。把磁针放到通电导线旁边，看看它会不会沉默。',
        'Counterexample: do not separate them too soon. Put a compass by the current-carrying wire and see if it stays silent.'
      )
      return text(
        '你把电和磁画在两页纸上，认为它们互不相干。但磁针还没上场——先把它放到通电导线旁边，看看它会不会保持沉默。',
        'You draw electricity and magnetism on separate pages, assuming they are unrelated. But the compass has not yet spoken — put it beside a current-carrying wire and see if it stays silent.'
      )
    }
  },
  {
    id: 'law_current_magnetism',
    type: 'theory',
    chapter: 6,
    label: text('提出新概念：电流周围会产生磁场，使磁针偏转', 'Propose: An electric current produces a magnetic field around it'),
    hint: text('精力1 需：磁针偏转 记录3 思路1', 'Focus 1; requires: compass deflection, Notes 3, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.oersted,
    requires: (s) => s.facts.oersted && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.currentMagnetism = true
      s.chapter = 7
      s.feedback = null
      return text(
        '你写下：电流周围存在磁场，能使磁针偏转。导线周围不再是空的，而环绕着看不见的磁力线。电和磁统一的第一步完成了。',
        'You write: an electric current produces a magnetic field around it, which can deflect a compass needle. The space around the wire is no longer empty — it carries circular magnetic field lines. The first step in unifying electricity and magnetism is complete.'
      )
    }
  },
  {
    id: 'move_magnet_coil',
    type: 'experiment',
    chapter: 7,
    label: text('移动磁铁：磁铁穿过线圈会产生电吗？', 'Move a Magnet: Does It Generate Current in a Coil?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.induction = true
      return text(
        '磁铁穿过线圈时，电流表的指针动了！磁能生电——但这和奥斯特发现的电生磁不同，这里的关键似乎是“运动”。',
        'When the magnet moves through the coil, the meter needle moves! Magnetism can generate electricity — but unlike Ørsted’s discovery, the key here seems to be motion.'
      )
    }
  },
  {
    id: 'wrong_static_magnet_current',
    type: 'misconception',
    chapter: 7,
    label: text('错误直觉：磁铁放在线圈旁边就能一直发电？', 'Misconception: A Stationary Magnet Produces Continuous Current?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.induction && !s.facts.changeMatters,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：磁铁停住时，指针也安静下来。这里真正关键的不是磁铁，而是变化。',
        'Counterexample: when the magnet stops, the needle rests too. The key is not the magnet by itself, but change.'
      )
      return text(
        '你把磁铁停在线圈旁边，等着电流自己出现。但指针纹丝不动——静止的磁铁不会产生电流。关键不是磁铁本身，而是磁场的变化。',
        'You hold the magnet still beside the coil and wait for current. But the needle does not move — a stationary magnet produces no current. The key is not the magnet itself, but the change in the magnetic field.'
      )
    }
  },
  {
    id: 'reverse_motion',
    type: 'experiment',
    chapter: 7,
    label: text('反向移动：磁铁反方向动，电流也反向吗？', 'Reverse: Does Moving the Other Way Reverse the Current?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.induction,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.changeMatters = true
      return text(
        '磁铁反向移动时，指针也反向偏转。线圈“听”见的不是磁铁本身，而是磁场的变化。变化的磁场产生电流——这就是电磁感应。',
        'When you move the magnet the other way, the needle deflects in the opposite direction. The coil does not respond to the magnet itself, but to the changing magnetic field. A changing magnetic field induces current — this is electromagnetic induction.'
      )
    }
  },
  {
    id: 'law_induction',
    type: 'theory',
    chapter: 7,
    label: text('提出新概念：变化的磁场会在闭合线圈中产生感应电流', 'Propose: A changing magnetic field induces an electric current in a closed circuit'),
    hint: text('精力1 需：变化 记录3 思路1 预言1', 'Focus 1; requires: change, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.changeMatters,
    requires: (s) => s.facts.changeMatters && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.induction = true
      s.chapter = 8
      s.feedback = null
      return text(
        '你写下电磁感应定律：变化的磁场会在闭合回路中产生感应电动势，从而驱动电流。这是法拉第的伟大发现——“变化”本身成了一种驱动力。',
        'You write the law of electromagnetic induction: a changing magnetic flux induces an electromotive force in a closed circuit, driving a current. This is Faraday’s great discovery — "change" itself becomes a driving force.'
      )
    }
  },
  {
    id: 'draw_fields',
    type: 'experiment',
    chapter: 8,
    label: text('画场线：空间本身有结构吗？', 'Draw Field Lines: Does Space Itself Have Structure?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism && s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fields = true
      return text(
        '你不再只画物体，而开始画空间中的力线。电场线和磁场线穿过虚空，像给看不见的力铺了路——“场”的概念诞生了：空间本身有物理结构。',
        'You stop drawing only objects and begin drawing lines of force through space. Electric and magnetic field lines cross empty regions like roads for the invisible — the concept of "field" is born: space itself has physical structure.'
      )
    }
  },
  {
    id: 'wrong_light_separate',
    type: 'misconception',
    chapter: 8,
    label: text('错误直觉：光和电磁是两回事？', 'Misconception: Is Light Separate from Electromagnetism?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.fields && !s.facts.lightSpeed,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：把电磁场传播的速度算出来，它太像光速了。这个巧合不肯安静。',
        'Counterexample: calculate the speed of electromagnetic propagation. It looks far too much like the speed of light to stay quiet.'
      )
      return text(
        '你把光单独放到一边，认为它和电磁无关。但等一下——算一算电磁波的速度，那个数字太眼熟了，和光速一模一样。这不是巧合。',
        'You set light aside, thinking it is separate from electromagnetism. But wait — calculate the speed of electromagnetic waves. That number looks too familiar: it matches the speed of light exactly. This is no coincidence.'
      )
    }
  },
  {
    id: 'measure_wave_speed',
    type: 'experiment',
    chapter: 8,
    label: text('计算电磁波速度：它和光速一样吗？', 'Calculate: Does the EM Wave Speed Match the Speed of Light?'),
    hint: text('精力2 -> 预言2 思路1', 'Focus 2 -> Predictions +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.fields,
    once: true,
    run(s) {
      s.predictions += 2
      s.insight += 1
      s.facts.lightSpeed = true
      return text(
        '你用电学和磁学的常数算出了电磁波的传播速度——约每秒30万公里。这个数字和测量到的光速完全一致。光，就是电磁波。',
        'You calculate the speed of electromagnetic waves using electric and magnetic constants — about 300,000 km/s. This matches the measured speed of light exactly. Light is an electromagnetic wave.'
      )
    }
  },
  {
    id: 'law_maxwell',
    type: 'theory',
    chapter: 8,
    label: text('提出新概念：变化的电场和磁场互相激发，以光速向外传播，光就是电磁波', 'Propose: Changing electric and magnetic fields generate each other, propagating at light speed; light is an EM wave'),
    hint: text('精力1 需：场 光速 记录2 思路2 预言2', 'Focus 1; requires: fields, speed of light, Notes 2, Insight 2, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.lightSpeed,
    requires: (s) => s.facts.fields && s.facts.lightSpeed && s.records >= 2 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 2
      s.insight -= 2
      s.predictions -= 2
      s.laws.maxwell = true
      s.chapter = 9
      s.feedback = null
      return text(
        '你写下麦克斯韦方程组。变化的电场产生磁场，变化的磁场产生电场——它们互相激发，以光速向外传播。光，原来就是电磁波。电磁学统一了。',
        'You write Maxwell’s equations. A changing electric field generates a magnetic field, and a changing magnetic field generates an electric field — they sustain each other and propagate at the speed of light. Light is an electromagnetic wave. Electromagnetism is unified.'
      )
    }
  },
  {
    id: 'spin_motor',
    type: 'experiment',
    chapter: 9,
    label: text('造电动机：通电线圈在磁场中会转吗？', 'Build a Motor: Will a Current-Carrying Coil Spin in a Magnetic Field?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.motor = true
      return text(
        '通电线圈在磁场中转动起来，换向器让它持续旋转。电能变成了机械运动——这就是电动机的原理。法拉第的“小玩具”将改变整个世界。',
        'A current-carrying coil spins in a magnetic field, and a commutator keeps it turning. Electrical energy becomes mechanical motion — this is the principle of the electric motor. Faraday’s "little toy" will change the world.'
      )
    }
  },
  {
    id: 'wrong_power_free',
    type: 'misconception',
    chapter: 9,
    label: text('错误直觉：电动机凭空产生能量？', 'Misconception: Does a Motor Create Energy from Nothing?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.motor && !s.facts.generator,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：电动机转得越用力，电池越快疲惫。机器不是凭空给力，而是在交换能量。',
        'Counterexample: the harder the motor works, the faster the battery tires. A machine does not make power from nothing; it trades energy.'
      )
      return text(
        '你差点把电动机的转动当成凭空产生的能量。但电池在发热——能量不是白来的，电动机只是把电能转换成机械能，总能量守恒。',
        'You almost treat the motor’s rotation as free energy. But the battery is warming up — energy is not created from nothing. The motor converts electrical energy into mechanical energy; total energy is conserved.'
      )
    }
  },
  {
    id: 'turn_generator',
    type: 'experiment',
    chapter: 9,
    label: text('造发电机：反过来转线圈能发电吗？', 'Build a Generator: Can Spinning a Coil Generate Electricity?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.generator = true
      return text(
        '你用手转动线圈，电流表醒了。电动机反过来用就是发电机——机械运动变成了电。电动机和发电机是同一原理的两个方向：电和运动可以互相转换。',
        'You spin the coil by hand, and the meter wakes. Run backward, a motor becomes a generator — mechanical motion becomes electricity. Motor and generator are two directions of the same principle: electricity and motion are interchangeable.'
      )
    }
  },
  {
    id: 'light_filament',
    type: 'experiment',
    chapter: 9,
    label: text('点亮灯泡：电能可以变成光和热', 'Light a Bulb: Electricity Becomes Light and Heat'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.facts.generator,
    once: true,
    run(s) {
      s.records += 1
      s.facts.bulb = true
      return text(
        '电流通过细灯丝，把它烧得白亮。电能变成了光和热——电不仅可以驱动机器，还能照亮黑夜。电力时代的曙光出现了。',
        'Current passes through a thin filament, heating it until it glows white. Electricity becomes light and heat — it can not only drive machines but also illuminate the night. The dawn of the electric age appears.'
      )
    }
  },
  {
    id: 'law_electric_power',
    type: 'theory',
    chapter: 9,
    label: text('提出新概念：发电、输电、用电可以组成完整的电力系统', 'Propose: Generation, transmission, and consumption form a complete electric power system'),
    hint: text('精力1 需：电机 发电机 灯 记录4 思路1 预言1', 'Focus 1; requires: motor, generator, lamp, Notes 4, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.bulb,
    requires: (s) => s.facts.motor && s.facts.generator && s.facts.bulb && s.records >= 4 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 1
      s.laws.electricPower = true
      s.chapter = 10
      s.feedback = null
      return text(
        '你把发电机、输电线和用电设备连成一条链：能量可以在远处产生，通过电线输送到需要的地方。电力系统的蓝图已经画好——黑夜第一次显得可以被工程管理。',
        'You link generator, transmission lines, and electrical devices into one chain: energy can be generated far away and delivered through wires to where it is needed. The blueprint of the electric power system is drawn — night begins to look like something engineering can manage.'
      )
    }
  },
  {
    id: 'spark_gap',
    type: 'experiment',
    chapter: 10,
    label: text('火花放电：电磁波能被制造出来吗？', 'Make a Spark: Can EM Waves Be Generated?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.maxwell,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spark = true
      return text(
        '火花在间隙里啪地跳过。根据麦克斯韦的理论，这种快速变化的电流应该产生电磁波。赫兹的装置虽小，却要证明电磁波真的存在。',
        'A spark snaps across the gap. According to Maxwell’s theory, this rapidly changing current should produce electromagnetic waves. Hertz’s apparatus is small, but it aims to prove EM waves really exist.'
      )
    }
  },
  {
    id: 'wrong_wire_needed',
    type: 'misconception',
    chapter: 10,
    label: text('错误直觉：信息必须通过导线才能传递？', 'Misconception: Must Signals Travel Through Wires?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spark && !s.facts.antenna,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：麦克斯韦方程允许波离开导体。先让火花和天线说话，再决定消息能走多远。',
        'Counterexample: Maxwell’s equations allow waves to leave conductors. Let the spark and the antenna speak before deciding how far messages can go.'
      )
      return text(
        '你把信息困在铜线上，认为没有导线就无法传递。但麦克斯韦的方程说电磁波可以离开导线自由传播——火花已经在敲墙了，试试用天线接收它。',
        'You trap messages in copper, thinking they cannot travel without wires. But Maxwell’s equations say EM waves can leave conductors and propagate freely — the spark is already tapping the wall. Try receiving it with an antenna.'
      )
    }
  },
  {
    id: 'build_antenna',
    type: 'experiment',
    chapter: 10,
    label: text('架设天线：能接收到远处传来的电磁波吗？', 'Raise an Antenna: Can It Receive Distant EM Waves?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.spark,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.antenna = true
      return text(
        '天线把火花的快速振荡变成电磁波抛向空间。看不见的波从导线边缘挣脱，以光速向外跑去——信息第一次可以不用导线传递了。',
        'The antenna converts the spark’s rapid oscillations into electromagnetic waves and launches them into space. Invisible waves break free from the wire and race outward at light speed — for the first time, information can travel without wires.'
      )
    }
  },
  {
    id: 'tune_receiver',
    type: 'experiment',
    chapter: 10,
    label: text('调谐接收：怎样从众多信号中选出想要的那一个？', 'Tune a Receiver: How to Pick One Signal from Many?'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.antenna,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.radio = true
      return text(
        '接收器只在特定频率上响应。通过调谐，你可以从空中众多电磁波中选出想要的那一个——这就是无线电通信的原理：用频率区分不同的信号。',
        'The receiver responds only at a specific frequency. By tuning, you can pick one signal from the many EM waves in the air — this is the principle of radio communication: different frequencies carry different messages.'
      )
    }
  },
  {
    id: 'law_radio',
    type: 'theory',
    chapter: 10,
    label: text('提出新概念：信息可以通过调制电磁波，跨越空间无线传输', 'Propose: Information can be encoded onto EM waves and transmitted wirelessly across space'),
    hint: text('精力1 需：天线 调谐 记录3 思路1 预言1', 'Focus 1; requires: antenna, tuning, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.radio,
    requires: (s) => s.facts.antenna && s.facts.radio && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.radio = true
      s.chapter = 11
      s.feedback = null
      return text(
        '你实现了无线通信：把信息编码到电磁波上发射出去，再用调谐接收器从空气中把它提取出来。暗室终于能听见远方的声音——无线电时代开始了。',
        'You establish wireless communication: encode information onto EM waves, transmit them, and recover the signal with a tuned receiver. The dark room can finally hear distant voices — the age of radio begins.'
      )
    }
  },
  {
    id: 'heat_water',
    type: 'experiment',
    chapter: 11,
    label: text('加热水壶：蒸汽能推动东西，热变成了运动？', 'Heat the Kettle: Can Steam Turn Heat into Motion?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.steam = true
      return text(
        '水汽顶起壶盖，热变成了机械运动。热不是一种“东西”，而是一种能推动物体做功的能量形式。你开始怀疑“热质说”——如果热是流体，摩擦为什么能无限产生它？',
        'Steam lifts the lid: heat becomes mechanical motion. Heat is not a substance but a form of energy that can do work. You begin to doubt the caloric theory — if heat is a fluid, why can friction produce it endlessly?'
      )    }
  },
  {
    id: 'wrong_caloric',
    type: 'misconception',
    chapter: 11,
    label: text('错误直觉：热是一种叫“热质”的流体？', 'Misconception: Is Heat a Fluid Called "Caloric"?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.steam && !s.facts.joule,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：摩擦和搅拌也能不断生热。热不像一桶会倒空的液体，更像运动被打散后的账本。',
        'Counterexample: friction and stirring can keep making heat. Heat is less like a fluid that empties and more like a ledger of scattered motion.'
      )
      return text(
        '你把热想象成一种会流动的“热质”。但等一下——摩擦和搅拌也能不断产生热，如果是流体早就用光了。热更像是一种能量，而不是一种物质。',
        'You picture heat as a flowing "caloric fluid." But wait — friction and stirring also produce heat endlessly; a fluid would have run out. Heat behaves more like energy than a substance.'
      )    }
  },
  {
    id: 'turn_paddle',
    type: 'experiment',
    chapter: 11,
    label: text('焦耳实验：用机械搅拌加热水，功和热有固定兑换率吗？', 'Joule’s Experiment: Does Mechanical Work Produce a Fixed Amount of Heat?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.steam,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.joule = true
      return text(
        '桨叶搅动水，温度慢慢升高。焦耳精确测量了机械功和产生的热量之间的比例——功和热有固定的兑换率。热不是物质，而是能量的一种形式。',
        'Paddles stir the water, and the temperature rises. Joule precisely measures the ratio between mechanical work and heat produced — work and heat have a fixed exchange rate. Heat is not a substance but a form of energy.'
      )    }
  },
  {
    id: 'build_heat_engine',
    type: 'experiment',
    chapter: 11,
    label: text('分析热机：热怎样转化为功？效率有上限吗？', 'Analyze: How Does Heat Become Work? Is There an Efficiency Limit?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.joule,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.engine = true
      return text(
        '高温蒸汽推动活塞，活塞带动飞轮。瓦特的蒸汽机把矿井、工厂和城市接进同一个节拍——但仔细分析会发现，热不可能全部变成功，总有一部分排给冷端。',
        'Hot steam pushes the piston, which drives the flywheel. Watt’s engine connects mines, factories, and cities to the same rhythm — but analyze it carefully: heat can never be fully converted to work; some always escapes to the cold side.'
      )    }
  },
  {
    id: 'law_energy',
    type: 'theory',
    chapter: 11,
    label: text('提出新概念：能量不会凭空产生或消失，只能从一种形式转化为另一种', 'Propose: Energy cannot be created or destroyed, only converted from one form to another'),
    hint: text('精力1 需：功热转换 热机 记录3 思路1 预言1', 'Focus 1; requires: work–heat conversion, engine, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.engine,
    requires: (s) => s.facts.joule && s.facts.engine && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.energy = true
      s.chapter = 12
      s.feedback = null
      return text(
        '你写下能量守恒定律：功、热、电和运动可以互相转换，但总能量不会凭空增减。这是物理学最牢固的基石之一——能量既不会创生，也不会消失。',
        'You write the law of conservation of energy: work, heat, electricity, and motion can change form, but the total energy never increases or decreases. This is one of the firmest foundations of physics — energy is neither created nor destroyed.'
      )    }
  },
  {
    id: 'watch_waste_heat',
    type: 'experiment',
    chapter: 12,
    label: text('观察废热：热机为什么总有一部分热浪费掉？', 'Observe Waste Heat: Why Do Engines Always Waste Some Heat?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.energy,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.wasteHeat = true
      return text(
        '热机做了功，但也把大量热量排给了低温端。能量没有消失，但一部分能量从“可用来做功”变成了“散乱无法利用”——这就是熵增的直觉。',
        'The engine does work but also dumps much heat into the cold side. Energy is not lost, but some of it goes from "usable for work" to "dispersed and unusable" — this is the intuition behind entropy increase.'
      )    }
  },
  {
    id: 'wrong_perpetual_engine',
    type: 'misconception',
    chapter: 12,
    label: text('错误直觉：能不能造一台不浪费热量的完美热机？', 'Misconception: Can We Build a Perfect Engine with No Waste Heat?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.wasteHeat && !s.facts.carnotCycle,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只看能量守恒还不够。热总要从热处流向冷处，循环会留下代价。',
        'Counterexample: conservation alone is not enough. Heat flows from hot to cold, and a cycle leaves a cost.'
      )
      return text(
        '你画出一台不浪费任何热量的完美热机。纸上很完美，但现实中必须有温差才能做功——冷端不肯消失，第二类永动机是不可能的。',
        'You draw a perfect engine that wastes no heat. Perfect on paper, but in reality a temperature difference is needed to do work — the cold side refuses to disappear. A perpetual motion machine of the second kind is impossible.'
      )    }
  },
  {
    id: 'trace_carnot_cycle',
    type: 'experiment',
    chapter: 12,
    label: text('卡诺循环：热机的理论最高效率是多少？', 'Carnot Cycle: What Is the Theoretical Maximum Efficiency?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.wasteHeat,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.carnotCycle = true
      return text(
        '卡诺把热机的工作过程拆成四个理想步骤：等温膨胀、绝热膨胀、等温压缩、绝热压缩。热机的最高效率只取决于高温和低温的温差——这是自然规律，不是工程问题。',
        'Carnot breaks the engine cycle into four ideal steps: isothermal expansion, adiabatic expansion, isothermal compression, adiabatic compression. The maximum efficiency depends only on the temperature difference — this is a law of nature, not an engineering problem.'
      )    }
  },
  {
    id: 'count_microstates',
    type: 'experiment',
    chapter: 12,
    label: text('玻尔兹曼的洞察：无序度能用分子排列方式来衡量吗？', 'Boltzmann’s Insight: Can Disorder Be Measured by Counting Molecular Arrangements?'),
    hint: text('精力1 -> 思路1', 'Focus 1 -> Insight +1'),
    cost: 1,
    requires: (s) => s.facts.carnotCycle,
    once: true,
    run(s) {
      s.insight += 1
      s.facts.entropyClue = true
      return text(
        '玻尔兹曼把熵和分子的微观排列联系起来：一个系统的宏观状态对应着无数种分子排列方式。“无序”不是没有规律，而是可能性太多——熵是微观状态数的度量。',
        'Boltzmann connects entropy to microscopic arrangements: a macrostate corresponds to countless molecular configurations. "Disorder" is not lawlessness but an overwhelming number of possibilities — entropy measures the number of microstates.'
      )    }
  },
  {
    id: 'law_entropy',
    type: 'theory',
    chapter: 12,return text(
        '音叉在手里快速振动，声音传到了耳朵。你开始怀疑：音叉的振动是不是通过空气传过来的？声音不是“东西”，而是振动在介质中的传播。',
        'The tuning fork vibrates rapidly in your hand, and sound reaches your ear. You begin to suspect: is the vibration traveling through the air? Sound is not a "thing" but the propagation of vibration through a medium.'
      )ropyClue,
    requires: (s) => s.facts.carnotCycle && s.facts.entropyClue && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.entropy = true
      s.chapter = 13
      s.feedback = null
      return text(
        '你写下热力学第二定律：孤立系统的熵永不减少。能量仍然守恒，但“可用来做功”的那部分会不断散失。熵的增加给了时间一个方向——过去和未来不再对称。',
        'You write the second law of thermodynamics: the entropy of an isolated system never decreases. Energy is still conserved, but the portion "usable for work" keeps dispersing. Entreturn text(
        '你把声音想象成细小的微粒从发声体飞出去。但音叉还在振动——如果声音是物质，音叉早就该变轻了。声音传递的是振动，不是物质本身。',
        'You imagine sound as tiny particles flying out from the source. But the tuning fork keeps vibrating — if sound were matter, the fork would get lighter. Sound transmits vibration, not matter itself.'
      )a Tuning Fork: How Is Sound Produced?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.vibration = true
      return text(
        '音叉在手里快速振动，声音传到了耳朵。你开始怀疑：音叉的振动是不是通过空气传过来的？声音不是“东西”，而是振动在介质中的传播。',
        'The tuning fork vibrates rapidly in your hand, and the sound reaches your ear. You begin to suspect: does thereturn text(
        '玻璃罩里的铃还在动，但抽掉空气后声音越来越薄，最后消失了。空气不是旁观者——它是声音传播的介质。声音需要物质来传递振动。',
        'The bell still moves inside the jar, but as air is pumped out, the sound grows thinner and vanishes. Air is not a bystander — it is the medium that carries sound. Sound needs matter to transmit vibration.'
      )label: text('错误直觉：声音是某种物质从发声体飞出来？', 'Misconception: Is Sound a Substance Flying Out of the Source?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.vibration && !s.facts.airWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：声音穿过空气，却不是把一团物质丢到耳朵里。抽走空气后，它会消失。',
        'Counterexample: sound crosses air, but it does not throw a lump of matter inreturn text(
        '在某个频率上，金属板上的细沙跳出了清晰的花纹。声音不是乱颤，而是有特定频率和波长的机械波——不同的频率对应不同的图案。',
        'At a certain frequency, sand on the metal plate jumps into clear patterns. Sound is not random trembling but a mechanical wave with specific frequency and wavelength — different frequencies produce different patterns.'
      )ing away. The fork keeps trembling, hinting that what travels is not matter itself.'
      )
    }
  },
  {
    id: 'bell_jar',
    type: 'experiment',
    chapter: 13,
    label: text('真空实验：没有空气，声音还能传播吗？', 'Vacuum Experiment: Can Sound Travel Without Air?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.vibration,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.airWave = true
      return text(
        '玻璃罩里的铃还在动，但抽掉空气后声音越来越薄，最后消失了。空气不是旁观者——它是声音传播的介质。声音需要物质来传递振动。',
        'The bell still moves inside the jar, but the sound thins away. Air is not a bystander; it is the road soreturn text(
        '你写下声学的基本原理：声音是介质中的机械波，有频率、波长和振幅。听见世界，原来是在解读空气的振动——从音叉到人耳，都是波的故事。',
        'You write the principles of acoustics: sound is a mechanical wave in a medium, with frequency, wavelength, and amplitude. Hearing the world means reading the vibrations of air — from tuning fork to eardrum, it is all a story of waves.'
      )Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.airWave,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.resonance = true
      return text(
        '在某个频率上，金属板上的细沙跳出了清晰的花纹。声音不是乱颤，而是有特定频率和波长的机械波——不同的频率对应不同的图案。',
        'At one frequency, sand jumps into a clear patterreturn text(
        '白光被棱镜拆成了一条彩色长带——从红到紫。牛顿断定：白光不是单纯的，而是由许多不同颜色的光混合而成。颜色本来就藏在白光里，棱镜只是把它们分开了。这是人类第一次看清光的组成。',
        'White light is split by the prism into a colored band — from red to violet. Newton concludes: white light is not pure but a mixture of many colors. The colors were always there; the prism merely separates them.'
      )预言1', 'Focus 1; requires: air, resonance, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.resonance,
    requires: (s) => s.facts.airWave && s.facts.resonance && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.sound = true
      s.chapter = 14
      s.feedback = null
      return text(
        '你写下声学的基本原理：声音是介质中的机械波，有频率、波长和振幅。听见世界，原来是在解读空气的振动——从音叉到人耳，都是波的故事。',
        'You understand sound as a wave: particles of the medium vibrate back and forth while threturn text(
        '你把彩色归功于棱镜，认为是玻璃“制造”了颜色。但光谱整齐得像一份被拆开的名单——颜色本来就存在，棱镜只是把它们分开。',
        'You credit the prism for the colors, thinking the glass "created" them. But the spectrum is orderly, like an unfolded list — the colors were already there; the prism only separates them.'
      )ext('棱镜实验：白光真的是纯的吗？', 'Prism Experiment: Is White Light Really Pure?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectrum = true
      return text(
        '白光被棱镜拆成了一条彩色长带——从红到紫。牛顿断定：白光不是单纯的，而是由许多不同颜色的光混合而成。颜色本来就藏在白光里，棱镜只是把它们分开了。这是人类第一次看清光的组成。',
        'White light splits into a colored band from red to violet. Newton conreturn text(
        '透镜把远处的烛火聚焦到纸上。望远镜和显微镜从同一种折射原理中诞生——光在不同介质中会弯曲，遵循斯涅尔定律。',
        'A lens focuses a distant candle flame onto paper. Telescopes and microscopes are born from the same principle of refraction — light bends when passing between media, following Snell’s law.'
      )type: 'misconception',
    chapter: 14,
    label: text('错误直觉：颜色是棱镜“制造”出来的？', 'Misconception: Does the Prism "Create" Colors?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum && !s.facts.interference,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：再用第二个棱镜可以把颜色合回白光。玻璃改变路径，却不是凭空制造颜色。',
        'Counterexample: a second prism can recreturn text(
        '两条狭缝在墙上织出了明暗相间的条纹。杨氏实验证明光能像水波一样干涉——波峰遇波峰则亮，波峰遇波谷则暗。光是一种波。',
        'Two slits weave bright and dark bands on the wall. Young’s experiment proves light can interfere like water waves — crest meets crest for brightness, crest meets trough for darkness. Light is a wave.'
      )he colors. The spectrum looks too orderly, like a list that has been unfolded.'
      )
    }
  },
  {
    id: 'focus_lens',
    type: 'experiment',
    chapter: 14,
    label: text('透镜成像：光可以弯曲和聚焦，遵循什么规律？', 'Lens Imaging: How Does Light Bend and Focus?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.lens = true
      return text(
        '透镜把远处的烛火聚焦到纸上。望远镜和显微镜从同一种折射原理中诞生——光在不同介质中会弯曲，遵循斯涅尔定律。',
        'A lens forms an image of a distant candle on paper. The telescope and the microscope grow out of the same refraction.'
      )
    }
  },
  {
    id: 'make_interference',
return text(
        '你写下波动光学：光会折射、成像、分色，也会干涉和衍射。它的传播不是一条直线，而是一整片波前。但光电效应的异常还在暗处等待——光的故事还没讲完。',
        'You establish wave optics: light refracts, forms images, disperses into colors, and also interferes and diffracts. Its propagation is not a single ray but an entire wavefront. But the photoelectric anomaly still waits in the dark — the story of light is not finished.'
      )=> s.facts.lens,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.interference = true
      return text(
        '两条狭缝在墙上织出了明暗相间的条纹。杨氏实验证明光能像水波一样干涉——波峰遇波峰则亮，波峰遇波谷则暗。光是一种波。',
        'Two slits weave bright and dark bands on the wall. Young’s experiment shows light adding and canceling like waves.'
      )
    }
  },
  {
    id: 'law_optics',
    type: 'theory',
    chapter: 14,
    label: text('提出新概念：光是一种波，可以干涉、衍射，但光电效应又显示它有粒子性', 'Propose: Light is a wave that can interfere and diffract, yet the photoelectric effect shows particle behavior'),
    hint: text('精力1 需：光谱 透镜 干涉 记录3 思路1 预言1', 'Focus 1; requires: spectrum, lens, interference, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.interference,
    requires: (s) => s.facts.spectrum && s.facts.lens && s.facts.interference && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.optics = true
      s.chapter = 15
      s.feedback = null
      return text(
        '你写下波动光学：光会折射、成像、分色，也会干涉和衍射。它的传播不是一条直线，而是一整片波前。但光电效应的异常还在暗处等待——光的故事还没讲完。',
        'You establish wave optics: light refracts, forms images, disperses into colors, and interferes. Its behavior is not just a ray path, but a whole wavefront.'
      )
    }
  },
  {
    id: 'chase_light',
    type: 'experiment',
    chapter: 15,
    label: text('思想实验：如果你追着一束光跑，会看到什么？', 'Thought Experiment: What Would You See If You Chased a Beam of Light?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.lightPuzzle = true
      return text(
        '你想象自己追着一束光跑。如果能追上，你会看到一束静止的光吗？但麦克斯韦的方程说电磁波永远以光速前进——追上了，波就冻住了。这个矛盾像一根刺。',
        'You imagine catching a beam of light. If you could, would Maxwell’s wave freeze? The thought is a splinter.'
      )
    }
  },
  {
    id: 'wrong_ether',
    type: 'misconception',
    chapter: 15,
    label: text('错误直觉：光必须有一个传播介质——以太？', 'Misconception: Must Light Have a Medium — the Ether?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.lightPuzzle && !s.facts.michelsonMorley,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：如果地球穿过以太，光速应该随方向略变。干涉仪会告诉你它有没有变。',
        'Counterexample: if Earth moves through ether, light speed should shift with direction. The interferometer will tell whether it does.'
      )
      return text(
        '你给光安排了一种传播介质——“以太”。这个想法听起来合理，但如果以太真的充满空间，地球在以太中运动时应该能测到“以太风”。去测一测。',
        'You assign a medium to light. Ether sounds respectable, but it must leave a measurable wind.'
      )
    }
  },
  {
    id: 'michelson_morley',
    type: 'experiment',
    chapter: 15,
    label: text('迈克耳孙-莫雷实验：光速在不同方向上一样吗？', 'Michelson-Morley: Is Light Speed the Same in All Directions?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.lightPuzzle,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.michelsonMorley = true
      return text(
        '迈克耳孙和莫雷转动干涉仪，条纹几乎不动。无论朝向哪个方向，光速都一样。以太风没有吹来——光速不变，以太不存在。旧直觉被实验结果推翻了。',
        'Michelson and Morley rotate the apparatus, and the fringes barely move. No ether wind arrives; instead, an old intuition is blown over.'
      )
    }
  },
  {
    id: 'sync_clocks',
    type: 'experiment',
    chapter: 15,
    label: text('关键洞察：“同时发生”是绝对的吗？', 'Key Insight: Is "Happening at the Same Time" Absolute?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.michelsonMorley,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.clocks = true
      return text(
        '你用光信号校准远处的时钟，发现“同时发生”不是宇宙免费赠送的绝对标签。两个事件是否同时，取决于观察者的运动状态——“现在”是一种约定。',
        'You synchronize distant clocks with light signals and find that simultaneity is not a free label from the universe, but a convention.'
      )
    }
  },
  {
    id: 'law_special_relativity',
    type: 'theory',
    chapter: 15,
    label: text('提出新概念：光速不变，时间和空间是相对的，E=mc²', 'Propose: Light speed is constant; time and space are relative; E=mc²'),
    hint: text('精力1 需：无以太 同时性 记录3 思路1 预言1', 'Focus 1; requires: no ether wind, simultaneity, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.clocks,
    requires: (s) => s.facts.michelsonMorley && s.facts.clocks && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.specialRelativity = true
      s.chapter = 16
      s.feedback = null
      return text(
        '你写下狭义相对论：光速在所有惯性系中不变，空间和时间不再是绝对的——运动的钟变慢，运动的尺缩短。E=mc²：质量和能量是同一枚硬币的两面。',
        'You establish special relativity: the speed of light is invariant, so space and time must adjust together. Einstein turns "now" into something that depends on how it is measured.'
      )
    }
  },
  {
    id: 'falling_elevator',
    type: 'experiment',
    chapter: 16,
    label: text('思想实验：在自由下落的电梯里，引力还在吗？', 'Thought Experiment: In a Freely Falling Elevator, Does Gravity Still Exist?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.specialRelativity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.elevator = true
      return text(
        '你想象自己在一个自由下落的电梯里。脚离开地板，感觉不到重量。爱因斯坦抓住这个念头：引力在局部和加速是无法区分的——这就是等效原理。',
        'Inside a freely falling elevator, gravity seems to vanish for a moment. Einstein holds tightly to this thought experiment.'
      )
    }
  },
  {
    id: 'wrong_gravity_force_only',
    type: 'misconception',
    chapter: 16,
    label: text('错误直觉：引力就是普通的力，和时空无关？', 'Misconception: Is Gravity Just an Ordinary Force?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.elevator && !s.facts.curvedSpacetime,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：自由落体可以局部抹掉重力感。也许引力不只是力，而是路径本身变了。',
        'Counterexample: free fall can locally erase the feeling of gravity. Perhaps gravity is not merely a force; perhaps the paths themselves have changed.'
      )
      return text(
        '你把引力画成一只看不见的手。但电梯里的失重感暗示：引力也许不是一种“力”，而是时空本身的弯曲效应。那只手开始变淡。',
        'You draw gravity as a hand. The weightlessness in the elevator quietly fades that hand.'
      )
    }
  },
  {
    id: 'predict_light_bending',
    type: 'experiment',
    chapter: 16,
    label: text('理论预言：太阳的质量会让经过的星光弯曲吗？', 'Predict: Does the Sun’s Mass Bend Starlight?'),
    hint: text('精力2 -> 记录1 预言2', 'Focus 2 -> Notes +1, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.elevator,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 2
      s.facts.curvedSpacetime = true
      return text(
        '如果时空会弯曲，光也该沿着弯曲的路径走。太阳的质量会让经过它边缘的星光偏折——这是给宇宙出的一道考题，日食时就能验证。',
        'If spacetime curves, light should follow the curve. Starlight beside the Sun becomes an exam question for the universe.'
      )
    }
  },
  {
    id: 'observe_eclipse',
    type: 'experiment',
    chapter: 16,
    label: text('实验验证：日食时观测星光是否真的偏折了', 'Verify: Observe Starlight During an Eclipse'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.curvedSpacetime,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.eclipse = true
      return text(
        '日食时拍下太阳边缘的星光，位置果然偏了——和爱因斯坦的预言一致。爱丁顿的照片让时空弯曲第一次有了实验证据。引力不是力，是几何。',
        'During the eclipse, starlight shifts slightly. Eddington’s photographs give curved spacetime its first public witness.'
      )
    }
  },
  {
    id: 'law_general_relativity',
    type: 'theory',
    chapter: 16,
    label: text('提出新概念：物质弯曲时空，弯曲的时空决定物质的运动——引力就是几何', 'Propose: Mass curves spacetime, and curved spacetime tells matter how to move — gravity is geometry'),
    hint: text('精力1 需：电梯 偏折观测 记录3 思路2 预言2', 'Focus 1; requires: falling elevator, light bending, Notes 3, Insight 2, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.eclipse,
    requires: (s) => s.facts.elevator && s.facts.eclipse && s.records >= 3 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 2
      s.laws.generalRelativity = true
      s.chapter = 17
      s.feedback = null
      return text(
        '你写下广义相对论：物质和能量告诉时空怎样弯曲，弯曲的时空告诉物质怎样运动。引力不是力，而是时空几何的体现。万有引力定律被更深的理论取代了。',
        'You establish general relativity: matter tells spacetime how to curve, and spacetime tells matter how to move. Gravity becomes geometry.'
      )
    }
  },
  {
    id: 'cathode_ray',
    type: 'experiment',
    chapter: 17,
    label: text('偏转阴极射线：原子内部有什么？', 'Deflect Cathode Rays: What Is Inside the Atom?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.electron = true
      return text(
        '阴极射线被电场和磁场偏转。汤姆孙测出了这种粒子的荷质比——它比最小的原子还轻一千多倍。电子被发现了：原子不是最小的，它内部还有结构。',
        'Cathode rays bend in electric and magnetic fields. Thomson sees the electron: the atom is no longer the smallest hard sphere.'
      )
    }
  },
  {
    id: 'wrong_solid_atom',
    type: 'misconception',
    chapter: 17,
    label: text('错误直觉：原子是不可分割的实心小球？', 'Misconception: Are Atoms Indivisible Solid Spheres?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.electron && !s.facts.nucleus,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：如果原子是均匀实心球，少数粒子不该被金箔大角度弹回。',
        'Counterexample: if atoms are uniform solid balls, a few particles should not bounce back from gold foil at large angles.'
      )
      return text(
        '你把原子画成不可分割的硬球。但电子已经从里面跑出来了——如果原子里有带负电的电子，那正电荷在哪里？旧的原子图景已经撑不住了。',
        'You draw the atom as a hard sphere. An electron has already escaped from inside, while the picture pretends to be whole.'
      )
    }
  },
  {
    id: 'gold_foil',
    type: 'experiment',
    chapter: 17,
    label: text('轰击金箔：用α粒子探测原子内部结构', 'Bombard Gold Foil: Probe Atomic Structure with Alpha Particles'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.electron,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.nucleus = true
      return text(
        '大多数α粒子直接穿过了金箔，但极少数被猛地弹了回来。卢瑟福震惊了：就像炮弹被薄纸反弹。这说明原子内部几乎是空的，中心有一个极小极重的原子核。',
        'Most particles pass through, but a few rebound sharply. Rutherford sees cannonballs bounce from tissue paper: a tiny heavy nucleus sits at the center of the atom.'
      )
    }
  },
  {
    id: 'oil_drop',
    type: 'experiment',
    chapter: 17,
    label: text('测量油滴电荷：电荷是连续的还是分立的？', 'Measure Oil Drops: Is Charge Continuous or Discrete?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.nucleus,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.chargeQuantized = true
      return text(
        '密立根让带电油滴悬停在电场中，精确测出了每个油滴带的电荷。电荷总是一个最小单位的整数倍——电不是连续的，而是颗粒状的。基本电荷被确定了。',
        'Millikan holds oil drops suspended, and charge appears in repeated units. Electricity is not merely a continuous mist; it has a grain to it.'
      )
    }
  },
  {
    id: 'law_atomic_structure',
    type: 'theory',
    chapter: 17,
    label: text('提出新概念：原子有核，电子在外，电荷有最小单位', 'Propose: Atoms have a nucleus, electrons orbit outside, and charge comes in discrete units'),
    hint: text('精力1 需：电子 原子核 电荷量子 记录3 思路1 预言1', 'Focus 1; requires: electron, nucleus, quantized charge, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.chargeQuantized,
    requires: (s) => s.facts.electron && s.facts.nucleus && s.facts.chargeQuantized && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.atom = true
      s.chapter = 18
      s.feedback = null
      return text(
        '你写下原子的行星模型：电子在核外运动，原子核集中了几乎全部质量，电荷有最小单位。物质第一次被拆出了内部结构——但电子为什么不会掉进核里？新的问题出现了。',
        'You discover atomic structure: electrons occupy the outside, a tiny massive nucleus sits within, and electric charge comes in discrete units. Matter gains internal geography.'
      )
    }
  },
  {
    id: 'blackbody',
    type: 'experiment',
    chapter: 18,
    label: text('记录黑体辐射：热辐射的能量分布有什么规律？', 'Record Blackbody Radiation: What Pattern Does Thermal Radiation Follow?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.blackbody = true
      return text(
        '黑体炉口的颜色随温度改变，但经典物理公式在高频端完全失效——算出的能量无限大。普朗克被迫提出一个大胆假设：能量不是连续的，而是一份一份的“量子”。',
        'The blackbody furnace changes color with temperature, while classical formulas fail at high frequency. Planck is forced to divide energy into packets.'
      )
    }
  },
  {
    id: 'wrong_continuous_energy',
    type: 'misconception',
    chapter: 18,
    label: text('错误直觉：能量一定是连续的吗？', 'Misconception: Must Energy Be Continuous?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.blackbody && !s.facts.photoelectric,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：黑体辐射和光电效应都在逼你承认，光和能量有时像一份一份交付。',
        'Counterexample: blackbody radiation and the photoelectric effect both push you to admit that light and energy sometimes arrive in packets.'
      )
      return text(
        '你把能量画成光滑连续的斜坡。但黑体辐射的曲线像一排台阶——经典物理无法解释。能量可能不是连续的，而是以最小单位“量子”一份一份发射和吸收的。',
        'You draw energy as a smooth slope. The blackbody data refuses to fit that smooth picture.'
      )
    }
  },
  {
    id: 'photoelectric',
    type: 'experiment',
    chapter: 18,
    label: text('光电效应：为什么光能打出电子？', 'Photoelectric Effect: Why Does Light Knock Out Electrons?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.blackbody,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.photoelectric = true
      return text(
        '用很亮的红光照射金属，打不出电子；用微弱的紫光照射，电子却飞出来了。爱因斯坦解释：光是一粒粒的光子，每个光子的能量由频率决定——高频光子能量大，才能打出电子。',
        'Bright low-frequency light cannot eject electrons, while weak high-frequency light can. Einstein treats light as packets of energy, and the explanation opens.'
      )
    }
  },
  {
    id: 'law_quanta',
    type: 'theory',
    chapter: 18,
    label: text('提出新概念：光是一份一份的能量包，E=hν', 'Propose: Light comes in discrete energy packets, E=hν'),
    hint: text('精力1 需：黑体 光电效应 记录3 思路1 预言1', 'Focus 1; requires: blackbody radiation, photoelectric effect, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.photoelectric,
    requires: (s) => s.facts.blackbody && s.facts.photoelectric && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.quanta = true
      s.chapter = 19
      s.feedback = null
      return text(
        '你写下光量子假说：光既是波也是粒子——传播时像波，与物质交换能量时像一粒粒光子。经典物理的图像第一次裂出真正的裂缝，量子时代开始了。',
        'You discover light quanta: light can propagate like a wave while exchanging energy in particle-like packets. The classical picture cracks for real.'
      )
    }
  },
  {
    id: 'spectral_lines',
    type: 'experiment',
    chapter: 19,
    label: text('观察原子光谱：为什么原子只发出特定颜色的光？', 'Observe Atomic Spectra: Why Do Atoms Emit Only Specific Colors?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectralLines = true
      return text(
        '氢原子发出的光不是连续彩虹，而是一条条分立的谱线。每种原子都有自己独特的光谱——像指纹一样。原子内部有特定的能级，电子只能在能级之间跳跃。',
        'Hydrogen light is not a continuous rainbow, but fixed spectral lines. The atom sounds like an instrument with only certain notes.'
      )
    }
  },
  {
    id: 'wrong_planet_electron',
    type: 'misconception',
    chapter: 19,
    label: text('错误直觉：电子像小行星一样绕核转？', 'Misconception: Do Electrons Orbit Like Tiny Planets?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spectralLines && !s.facts.matterWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：绕圈的带电粒子按经典理论会辐射掉能量，掉进原子核。原子却稳定存在。',
        'Counterexample: a circling charged particle should radiate energy and fall into the nucleus. Atoms remain stable.'
      )
      return text(
        '你把电子画成绕核旋转的小行星。图很好懂，但有一个致命问题：加速运动的电子会辐射能量，应该在极短时间内掉进原子核——但原子是稳定的。经典物理在这里失效了。',
        'You draw electrons as tiny planets around the nucleus. The picture is clear, but it cannot explain why atoms do not collapse.'
      )
    }
  },
  {
    id: 'matter_wave',
    type: 'experiment',
    chapter: 19,
    label: text('德布罗意假说：电子也有波长？', 'de Broglie Hypothesis: Do Electrons Have a Wavelength?'),
    hint: text('精力2 -> 记录2 思路1 预言1', 'Focus 2 -> Notes +2, Insight +1, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.spectralLines,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.predictions += 1
      s.facts.matterWave = true
      return text(
        '德布罗意提出：电子也有波长。轨道不再是任意半径的圆圈，而必须是能容纳整数个波长的周长——像一根只能以特定频率振动的弦。物质也有波动性。',
        'de Broglie assigns a wavelength to the electron. Allowed orbits stop being arbitrary circles and become standing-wave conditions.'
      )
    }
  },
  {
    id: 'uncertainty',
    type: 'experiment',
    chapter: 19,
    label: text('不确定性：位置和动量能同时精确知道吗？', 'Uncertainty: Can Position and Momentum Both Be Known Exactly?'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.matterWave,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.uncertainty = true
      return text(
        '你越想精确测量电子的位置，它的动量就越不确定。海森堡说这不是仪器不够好，而是自然界的基本限制——位置和动量不能同时被精确知道。这就是不确定性原理。',
        'The more tightly you pin position, the more momentum spreads. Heisenberg is not blaming bad instruments; the world does not issue both exact receipts at once.'
      )
    }
  },
  {
    id: 'law_quantum_mechanics',
    type: 'theory',
    chapter: 19,
    label: text('提出新概念：粒子状态由波函数描述，只能计算概率，不能确定轨道', 'Propose: Particle states are described by wavefunctions; only probabilities can be calculated, not definite orbits'),
    hint: text('精力1 需：物质波 不确定性 记录3 思路2 预言1', 'Focus 1; requires: matter waves, uncertainty, Notes 3, Insight 2, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.uncertainty,
    requires: (s) => s.facts.matterWave && s.facts.uncertainty && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.quantum = true
      s.chapter = 20
      s.feedback = null
      return text(
        '你写下量子力学：薛定谔方程用波函数描述粒子的状态，给出的是概率而不是确定轨道。海森堡的不确定性划出了知识的边界。原子世界不再像精密的机械钟表——它由概率和不确定性支配。',
        'You establish quantum mechanics: Schrödinger’s wave function gives probabilities, and Heisenberg’s uncertainty principle sets limits. The atomic world is no tiny clockwork mechanism.'
      )
    }
  },
  {
    id: 'cloud_chamber',
    type: 'experiment',
    chapter: 20,
    label: text('观察云室：放射性粒子留下了什么痕迹？', 'Observe Cloud Chamber: What Traces Do Radioactive Particles Leave?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.radioactivity = true
      return text(
        '云室里细线突然出现又消失——那是放射性粒子留下的轨迹。贝克勒尔发现了铀的放射性，居里夫妇提炼出镭。他们打开的门通向原子核深处，那里藏着巨大的能量。',
        'Thin lines suddenly grow and vanish in the cloud chamber. The door opened by Becquerel and Marie Curie leads deep into the nucleus.'
      )
    }
  },
  {
    id: 'wrong_atom_immutable',
    type: 'misconception',
    chapter: 20,
    label: text('错误直觉：原子核是永恒不变的吗？', 'Misconception: Are Atomic Nuclei Eternal and Unchangeable?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.radioactivity && !s.facts.fission,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：放射性已经说明原子核会自己改变。用中子敲铀核，看看裂缝会不会变大。',
        'Counterexample: radioactivity already shows that nuclei can change on their own. Strike uranium with neutrons and see whether the crack grows.'
      )
      return text(
        '你把原子核当成不可改变的终极硬石头。但云室里的轨迹像石头里冒出的细烟——原子核可以自发衰变，变成另一种元素。原子核不是永恒不变的。',
        'You treat the nucleus as the final hard stone. Cloud-chamber tracks rise from it like thin smoke.'
      )
    }
  },
  {
    id: 'split_uranium',
    type: 'experiment',
    chapter: 20,
    label: text('用中子轰击铀核：核裂变能释放多少能量？', 'Split Uranium: How Much Energy Does Fission Release?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.radioactivity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fission = true
      return text(
        '用中子轰击铀核，它裂成了两块，并释放出更多中子。哈恩发现了核裂变，迈特纳用E=mc²解释：消失的质量变成了巨大的能量。链式反应成为可能。',
        'Uranium splits into two pieces and releases new neutrons. Hahn sees the result, and Meitner explains it: missing mass becomes energy.'
      )
    }
  },
  {
    id: 'chain_reaction',
    type: 'experiment',
    chapter: 20,
    label: text('计算链式反应：一个中子能引发多大的能量释放？', 'Calculate Chain Reaction: How Much Energy Can One Neutron Unleash?'),
    hint: text('精力2 -> 记录2 预言2', 'Focus 2 -> Notes +2, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.fission,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 2
      s.facts.chainReaction = true
      return text(
        '一个中子引发裂变，放出更多中子，这些中子又引发新的裂变——数字像火一样指数增长。费米建造了第一个核反应堆。同一条链式反应，可以发电，也可以爆炸。',
        'One neutron leads to more neutrons, and the numbers spread like fire. Fermi’s reactor and the atomic bomb stand at the same fork.'
      )
    }
  },
  {
    id: 'law_nuclear_age',
    type: 'theory',
    chapter: 20,
    label: text('提出新概念：核能可以发电也可以造武器——物理学走到了人类选择的十字路口', 'Propose: Nuclear energy can power cities or destroy them — physics arrives at a crossroads of human choice'),
    hint: text('精力1 需：裂变 链式反应 记录4 思路1 预言2', 'Focus 1; requires: fission, chain reaction, Notes 4, Insight 1, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.chainReaction,
    requires: (s) => s.facts.fission && s.facts.chainReaction && s.records >= 4 && s.insight >= 1 && s.predictions >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 2
      s.laws.nuclearAge = true
      s.complete = true
      s.feedback = null
      return text(
        '你写下核时代的开端：同一套物理原理既能点亮城市，也能毁灭城市。暗室最后没有给你一个“正确”的按钮——它只把知识和责任一起交回你手里。物理学的发展之路，由人类自己选择方向。',
        'You enter the nuclear age: the same physics can light cities and destroy them. The dark room gives you no final button; it places responsibility back in your hands.'
      )
    }
  }
]

const LAW_LIST = [
  { key: 'inertia', name: text('第一定律', 'First Law of Motion'), task: text('惯性', 'Inertia') },
  { key: 'second', name: text('第二定律', 'Second Law of Motion'), task: text('F = ma', 'F = ma') },
  { key: 'third', name: text('第三定律', 'Third Law of Motion'), task: text('相互作用', 'Interaction') },
  { key: 'gravity', name: text('万有引力', 'Universal Gravitation'), task: text('地月同律', 'Earth and Moon') },
  { key: 'principia', name: text('《原理》', 'Principia'), task: text('经典力学', 'Classical mechanics') },
  { key: 'charge', name: text('电荷', 'Charge'), task: text('吸引与排斥', 'Attraction and repulsion') },
  { key: 'currentMagnetism', name: text('电流磁效应', 'Magnetic Effect of Current'), task: text('电生磁', 'Current produces magnetism') },
  { key: 'induction', name: text('电磁感应', 'Electromagnetic Induction'), task: text('变化生电', 'Change produces current') },
  { key: 'maxwell', name: text('麦克斯韦方程', 'Maxwell’s Equations'), task: text('光是电磁波', 'Light is an EM wave') },
  { key: 'electricPower', name: text('电力系统', 'Electric Power'), task: text('电机与灯', 'Motors and lamps') },
  { key: 'radio', name: text('无线电', 'Radio'), task: text('远距离通信', 'Long-distance signals') },
  { key: 'energy', name: text('能量守恒', 'Conservation of Energy'), task: text('功热互换', 'Work and heat') },
  { key: 'entropy', name: text('熵增方向', 'Entropy'), task: text('时间箭头', 'Arrow of time') },
  { key: 'sound', name: text('声波', 'Sound Waves'), task: text('空气振动', 'Air vibration') },
  { key: 'optics', name: text('波动光学', 'Wave Optics'), task: text('干涉成像', 'Interference and imaging') },
  { key: 'specialRelativity', name: text('狭义相对论', 'Special Relativity'), task: text('光速不变', 'Invariant light speed') },
  { key: 'generalRelativity', name: text('广义相对论', 'General Relativity'), task: text('弯曲时空', 'Curved spacetime') },
  { key: 'atom', name: text('原子结构', 'Atomic Structure'), task: text('电子与原子核', 'Electron and nucleus') },
  { key: 'quanta', name: text('光量子', 'Light Quanta'), task: text('能量分份', 'Discrete energy packets') },
  { key: 'quantum', name: text('量子力学', 'Quantum Mechanics'), task: text('概率与不确定性', 'Probability and uncertainty') },
  { key: 'nuclearAge', name: text('核时代', 'Nuclear Age'), task: text('裂变与责任', 'Fission and responsibility') }
]

const FACT_CONCEPTS = [
  { key: 'calculus', name: text('微积分', 'Calculus'), task: text('计算瞬时变化', 'Instant change') },
  { key: 'fields', name: text('场', 'Field'), task: text('空间有结构', 'Structured space') },
  { key: 'motor', name: text('电动机', 'Motor'), task: text('电转成运动', 'Electricity to motion') },
  { key: 'bulb', name: text('灯泡', 'Lamp'), task: text('电转成光', 'Electricity to light') },
  { key: 'engine', name: text('热机', 'Heat Engine'), task: text('热推动机器', 'Heat drives machines') },
  { key: 'resonance', name: text('共振', 'Resonance'), task: text('频率选择', 'Frequency selection') },
  { key: 'spectrum', name: text('光谱', 'Spectrum'), task: text('颜色在光中', 'Colors in light') },
  { key: 'curvedSpacetime', name: text('时空弯曲', 'Curved Spacetime'), task: text('光路偏折', 'Bent light paths') },
  { key: 'electron', name: text('电子', 'Electron'), task: text('原子可分', 'Atoms have parts') },
  { key: 'nucleus', name: text('原子核', 'Nucleus'), task: text('小而重的中心', 'Small heavy center') },
  { key: 'matterWave', name: text('物质波', 'Matter Wave'), task: text('电子也有波', 'Electrons have wave behavior') },
  { key: 'fission', name: text('裂变', 'Fission'), task: text('质量变能量', 'Mass-energy conversion') }
]

const CHAPTER_FACT_KEYS = [
  ['watch_apple', 'compare_objects', 'build_slope', 'apple', 'manyFall', 'slope'],
  ['push_cart', 'vary_force', 'add_mass', 'invent_calculus', 'push', 'forceChange', 'mass', 'calculus'],
  ['collide_carts', 'pull_rope', 'measure_pair_force', 'collision', 'rope', 'equalPair'],
  ['read_moon', 'estimate_curve', 'compare_earth_sky', 'moon', 'curve', 'sameGravity'],
  [],
  ['rub_amber', 'compare_charges', 'amber', 'chargePair'],
  ['close_circuit', 'compass_near_wire', 'current', 'oersted'],
  ['move_magnet_coil', 'reverse_motion', 'induction', 'changeMatters'],
  ['draw_fields', 'measure_wave_speed', 'fields', 'lightSpeed'],
  ['spin_motor', 'turn_generator', 'light_filament', 'motor', 'generator', 'bulb'],
  ['spark_gap', 'build_antenna', 'tune_receiver', 'spark', 'antenna', 'radio'],
  ['heat_water', 'turn_paddle', 'build_heat_engine', 'steam', 'joule', 'engine'],
  ['watch_waste_heat', 'trace_carnot_cycle', 'count_microstates', 'wasteHeat', 'carnotCycle', 'entropyClue'],
  ['strike_tuning_fork', 'bell_jar', 'map_resonance', 'vibration', 'airWave', 'resonance'],
  ['pass_prism', 'focus_lens', 'make_interference', 'spectrum', 'lens', 'interference'],
  ['chase_light', 'michelson_morley', 'sync_clocks', 'lightPuzzle', 'michelsonMorley', 'clocks'],
  ['falling_elevator', 'predict_light_bending', 'observe_eclipse', 'elevator', 'curvedSpacetime', 'eclipse'],
  ['cathode_ray', 'gold_foil', 'oil_drop', 'electron', 'nucleus', 'chargeQuantized'],
  ['blackbody', 'photoelectric', 'blackbody', 'photoelectric'],
  ['spectral_lines', 'matter_wave', 'uncertainty', 'spectralLines', 'matterWave', 'uncertainty'],
  ['cloud_chamber', 'split_uranium', 'chain_reaction', 'radioactivity', 'fission', 'chainReaction']
]

const CHAPTER_LAW_KEYS = [
  ['inertia'],
  ['second'],
  ['third'],
  ['gravity'],
  ['principia'],
  ['charge'],
  ['currentMagnetism'],
  ['induction'],
  ['maxwell'],
  ['electricPower'],
  ['radio'],
  ['energy'],
  ['entropy'],
  ['sound'],
  ['optics'],
  ['specialRelativity'],
  ['generalRelativity'],
  ['atom'],
  ['quanta'],
  ['quantum'],
  ['nuclearAge']
]

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

function migrateSavedState(state) {
  if (state.complete && !state.laws.nuclearAge) {
    state.complete = false
    state.chapter = state.laws.maxwell ? 9 : Math.max(state.chapter || 0, 5)
    if (!state.laws.maxwell) state.laws.principia = true
    state.feedback = null
    state.logs = [
      {
        time: state.day || 1,
        text: text(
          '你翻开新的纸页。旧结局退后一步，电机、热机、光谱和原子核在暗处等着继续发问。',
          'You open a new page. The old ending steps aside, while motors, heat engines, spectra, and nuclei wait in the dark with new questions.'
        )
      },
      ...(state.logs || [])
    ]
  }
  return state
}

function clearProgressFromChapter(state, chapter) {
  for (let index = chapter; index < CHAPTERS.length; index += 1) {
    ;(CHAPTER_FACT_KEYS[index] || []).forEach((key) => {
      delete state.facts[key]
    })
    ;(CHAPTER_LAW_KEYS[index] || []).forEach((key) => {
      delete state.laws[key]
    })
  }
}

function findReadyTheory(state) {
  return ACTIONS.find((action) =>
    action.type === 'theory' &&
    action.chapter === state.chapter &&
    (!action.visible || action.visible(state)) &&
    canRun(state, action)
  )
}

function canRun(state, action) {
  if (state.complete) return false
  if (action.chapter !== state.chapter) return false
  if (action.once && state.facts[action.id]) return false
  if (action.cost && state.focus < action.cost) return false
  return !action.requires || action.requires(state)
}

function actionKind(action, lang) {
  if (action.type === 'theory') return pick(UI.kinds.theory, lang)
  if (action.type === 'experiment') return pick(UI.kinds.experiment, lang)
  if (action.type === 'misconception') return pick(UI.kinds.misconception, lang)
  return pick(UI.kinds.rest, lang)
}

const REST_OPTIONS = [
  { label: text('在苹果树下静坐', 'Sit under an apple tree'), hint: text('像牛顿一样，在树下沉思自然的奥秘', 'Like Newton, ponder nature under a tree') },
  { label: text('研磨三棱镜', 'Polish a prism'), hint: text('牛顿曾亲手磨制棱镜研究光的色散', 'Newton polished prisms to study light') },
  { label: text('弹奏鲁特琴', 'Play the lute'), hint: text('伽利略的父亲是鲁特琴师，他也擅长弹奏', 'Galileo was a skilled lute player') },
  { label: text('品一杯红酒', 'Sip some wine'), hint: text('伽利略最爱托斯卡纳的红酒，边饮边观星', 'Galileo loved Tuscan wine while stargazing') },
  { label: text('拉一曲小提琴', 'Play the violin'), hint: text('爱因斯坦的小提琴是他思考时的最佳伴侣', 'Einstein found clarity in his violin') },
  { label: text('泛舟湖上', 'Go sailing'), hint: text('爱因斯坦和玻尔都爱在湖上泛舟，任思绪漂流', 'Einstein and Bohr both loved sailing') },
  { label: text('与爱犬嬉戏', 'Play with the dog'), hint: text('麦克斯韦常带着他的狗在苏格兰乡间漫步', 'Maxwell walked the Scottish hills with his dog') },
  { label: text('朗诵一首诗', 'Recite a poem'), hint: text('麦克斯韦热爱诗歌，自己也写了不少', 'Maxwell loved poetry and wrote his own') },
  { label: text('骑自行车郊游', 'Go cycling'), hint: text('居里夫妇周末最爱骑车去巴黎郊外', 'The Curies cycled through the French countryside') },
  { label: text('弹一首钢琴曲', 'Play the piano'), hint: text('普朗克是出色的钢琴家，常与爱因斯坦合奏', 'Planck was a gifted pianist') },
  { label: text('在山间徒步', 'Hike in the mountains'), hint: text('普朗克一生热爱登山，从阿尔卑斯山获得灵感', 'Planck found inspiration in the Alps') },
  { label: text('装订一本旧书', 'Bind an old book'), hint: text('法拉第少年时是装订匠，在书中发现了科学', 'Faraday discovered science through bookbinding') },
  { label: text('在花园里种一株花', 'Plant a flower'), hint: text('库仑晚年最爱在自家花园里侍弄花草', 'Coulomb loved tending his garden') },
  { label: text('写一封家书', 'Write a letter home'), hint: text('伽利略常给修道院的女儿写信，倾诉心事', 'Galileo wrote heartfelt letters to his daughter') },
  { label: text('煮一壶热茶', 'Brew a pot of tea'), hint: text('麦克斯韦每天下午都要喝一杯苏格兰红茶', 'Maxwell never missed his afternoon tea') },
  { label: text('仰望星空', 'Gaze at the stars'), hint: text('开普勒说：仰望星空时，我们离真理最近', 'Kepler said stargazing brings us closest to truth') },
  { label: text('做炼金术实验', 'Try an alchemy experiment'), hint: text('牛顿一生痴迷炼金术，写下了百万字笔记', 'Newton wrote a million words on alchemy') },
  { label: text('翻阅百科全书', 'Browse an encyclopedia'), hint: text('安培少年时靠自学百科全书建立了知识体系', 'Ampère taught himself through encyclopedias') },
  { label: text('吹奏长笛', 'Play the flute'), hint: text('赫兹在实验室累了就吹一曲长笛放松', 'Hertz relaxed with his flute between experiments') },
  { label: text('做木工活', 'Do some woodworking'), hint: text('赫兹喜欢亲手制作实验装置，手艺精湛', 'Hertz was a skilled craftsman') }
]

function pickRestOption() {
  return REST_OPTIONS[Math.floor(Math.random() * REST_OPTIONS.length)]
}

const THEORY_DEFS = {
  law_inertia: text('物体在不受外力时保持静止或匀速直线运动', 'An object remains at rest or in uniform motion unless acted upon by a force'),
  law_second: text('力等于质量乘以加速度 F=ma', 'Force equals mass times acceleration F=ma'),
  law_third: text('作用力与反作用力大小相等方向相反', 'Every action has an equal and opposite reaction'),
  law_gravity: text('任何两个物体之间都存在引力，与质量乘积成正比', 'Every mass attracts every other mass with a force proportional to their product'),
  write_principia: text('将力学三大定律和万有引力系统化为经典力学体系', 'Systematize the laws of motion and gravity into classical mechanics'),
  law_charge: text('自然界存在正负两种电荷，同斥异吸', 'Nature has positive and negative charges; like repels, unlike attracts'),
  law_current_magnetism: text('电流通过导线时会在周围产生磁场', 'An electric current flowing through a wire creates a magnetic field around it'),
  law_induction: text('变化的磁场会在导体中产生感应电动势', 'A changing magnetic field induces an electromotive force in a conductor'),
  law_maxwell: text('电场和磁场相互激发，形成电磁波以光速传播', 'Electric and magnetic fields generate each other, forming electromagnetic waves traveling at light speed'),
  law_electric_power: text('利用电磁感应原理将机械能转化为电能', 'Convert mechanical energy into electrical energy using electromagnetic induction'),
  law_radio: text('利用电磁波在空间中传输信息', 'Use electromagnetic waves to transmit information through space'),
  law_energy: text('能量不会凭空产生或消失，只会从一种形式转化为另一种', 'Energy cannot be created or destroyed, only transformed from one form to another'),
  law_entropy: text('孤立系统的熵永不减少，自然过程有方向性', 'The entropy of an isolated system never decreases; natural processes have direction'),
  law_sound_wave: text('声音是介质中传播的机械纵波', 'Sound is a mechanical longitudinal wave propagating through a medium'),
  law_optics: text('光是一种电磁波，可解释干涉、衍射等现象', 'Light is an electromagnetic wave, explaining interference and diffraction'),
  law_special_relativity: text('物理定律在所有惯性系中相同，光速不变', 'The laws of physics are the same in all inertial frames; the speed of light is constant'),
  law_general_relativity: text('引力是时空弯曲的表现，物质告诉时空如何弯曲', 'Gravity is the curvature of spacetime; matter tells spacetime how to curve'),
  law_atomic_structure: text('原子由原子核和绕核运动的电子组成', 'Atoms consist of a nucleus surrounded by orbiting electrons'),
  law_quanta: text('光以离散的能量包（光子）形式存在 E=hν', 'Light exists as discrete packets of energy (photons) E=hν'),
  law_quantum_mechanics: text('微观粒子具有波粒二象性，由波函数描述', 'Microscopic particles exhibit wave-particle duality, described by wave functions'),
  law_nuclear_age: text('原子核可以裂变或聚变，释放巨大能量', 'Atomic nuclei can undergo fission or fusion, releasing enormous energy')
}

const THEORY_TOASTS = {
  law_inertia: text('恭喜你，你已经提出了牛顿第一运动定律。', 'You have discovered Newton’s first law of motion.'),
  law_second: text('恭喜你，你已经总结出牛顿第二运动定律。', 'You have discovered Newton’s second law of motion.'),
  law_third: text('恭喜你，你已经总结出牛顿第三运动定律。', 'You have discovered Newton’s third law of motion.'),
  law_gravity: text('恭喜你，你已经提出了万有引力定律。', 'You have proposed the law of universal gravitation.'),
  write_principia: text('恭喜你，你已经写成《自然哲学的数学原理》。', 'You have written the Principia.'),
  law_charge: text('恭喜你，你已经定义了电荷概念。', 'You have defined electric charge.'),
  law_current_magnetism: text('恭喜你，你已经发现了电流的磁效应。', 'You have discovered the magnetic effect of electric current.'),
  law_induction: text('恭喜你，你已经发现了电磁感应：变化的磁通量会产生感应电动势。', 'You have discovered electromagnetic induction: a changing magnetic flux induces an emf.'),
  law_maxwell: text('恭喜你，你已经写下了麦克斯韦方程组。', 'You have written Maxwell’s equations.'),
  law_electric_power: text('恭喜你，你已经搭建出电力系统的基本图景。', 'You have built the basic picture of an electric power system.'),
  law_radio: text('恭喜你，你已经实现了无线通信。', 'You have established wireless communication.'),
  law_energy: text('恭喜你，你已经总结出能量守恒定律。', 'You have discovered the law of conservation of energy.'),
  law_entropy: text('恭喜你，你已经认识到熵增给出了自然过程的方向。', 'You have discovered the entropy principle: natural processes have a direction.'),
  law_sound_wave: text('恭喜你，你已经理解：声音是一种机械波。', 'You now understand that sound is a mechanical wave.'),
  law_optics: text('恭喜你，你已经建立了光的波动图像。', 'You have established the wave model of light.'),
  law_special_relativity: text('恭喜你，你已经建立了狭义相对论。', 'You have established special relativity.'),
  law_general_relativity: text('恭喜你，你已经建立了广义相对论。', 'You have established general relativity.'),
  law_atomic_structure: text('恭喜你，你已经发现了原子结构。', 'You have discovered atomic structure.'),
  law_quanta: text('恭喜你，你已经提出了光量子。', 'You have discovered light quanta.'),
  law_quantum_mechanics: text('恭喜你，你已经建立了量子力学。', 'You have established quantum mechanics.'),
  law_nuclear_age: text('恭喜你，你已经进入了核时代。', 'You have entered the nuclear age.')
}

function theoryToastText(action, lang) {
  if (THEORY_TOASTS[action.id]) return pick(THEORY_TOASTS[action.id], lang)

  const label = pick(action.label, lang)
  if (lang === 'zh') {
    return `恭喜你，新的理论已经完成：${label}。`
  }

  const patterns = [
    [/^Discover (.+)$/, 'You have discovered $1.'],
    [/^Establish (.+)$/, 'You have established $1.'],
    [/^Define (.+)$/, 'You have defined $1.'],
    [/^Understand (.+)$/, 'You now understand $1.'],
    [/^Build (.+)$/, 'You have built $1.'],
    [/^Enter (.+)$/, 'You have entered $1.'],
    [/^Write (.+)$/, 'You have written $1.'],
    [/^Propose (.+)$/, 'You have proposed $1.']
  ]
  for (const [pattern, template] of patterns) {
    const match = label.match(pattern)
    if (match) return template.replace('$1', match[1])
  }
  return `You have completed: ${label}.`
}

Page({
  data: {
    title: '牛顿的暗室',
    scene: '',
    goal: '',
    phaseLabel: '第一问',
    actions: [],
    resources: [],
    workers: [],
    logs: [],
    feedback: '',
    ui: {},
    lang: 'zh'
  },

  onLoad() {
    const saved = wx.getStorageSync(STORAGE_KEY)
    this.state = saved ? migrateSavedState({ ...cloneState(START_STATE), ...saved }) : cloneState(START_STATE)
    if (!this.state.lang) this.state.lang = 'zh'
    this.render()
  },

  onHide() {
    this.save()
  },

  switchLanguage() {
    this.state.lang = this.state.lang === 'zh' ? 'en' : 'zh'
    this.afterChange()
  },

  openResetMenu() {
    const lang = this.state.lang || 'zh'
    wx.showActionSheet({
      itemList: [pick(UI.resetChapter, lang), pick(UI.resetAll, lang)],
      success: (result) => {
        if (result.tapIndex === 0) this.resetChapter()
        if (result.tapIndex === 1) this.resetGame()
      }
    })
  },

  resetChapter() {
    const chapter = this.state.complete ? CHAPTERS.length - 1 : this.state.chapter
    clearProgressFromChapter(this.state, chapter)
    this.state.chapter = chapter
    this.state.complete = false
    this.state.focus = MAX_FOCUS
    this.state.feedback = null
    this.log(text(
      '你把本章的纸页翻回开头。前面的定律还在，眼前的问题重新变暗。',
      'You turn this chapter back to its first page. Earlier laws remain; the question before you grows dark again.'
    ))
    this.afterChange()
  },

  resetGame() {
    const lang = this.state.lang || 'zh'
    this.state = cloneState(START_STATE)
    this.state.lang = lang
    if (wx.removeStorageSync) wx.removeStorageSync(STORAGE_KEY)
    this.render()
  },

  handleAction(event) {
    const id = event.currentTarget.dataset.id
    if (id === 'propose_theory') {
      const theory = findReadyTheory(this.state)
      if (theory) {
        this.discoverTheory(theory)
      }
      this.afterChange()
      return
    }
    if (id === 'new_day') {
      this.state._restOption = null
      this.state._restOptions = null
      this.newDay()
      this.afterChange()
      return
    }

    const action = ACTIONS.find((item) => item.id === id)
    if (!action || !canRun(this.state, action)) return

    if (action.cost) this.state.focus -= action.cost
    const message = action.run(this.state)
    if (action.once) {
      this.state.facts[action.id] = true
      if (action.type === 'experiment') this.state.feedback = null
    }
    this.log(message)
    this.afterChange()
  },

  discoverTheory(action) {
    if (action.cost) this.state.focus -= action.cost
    const message = action.run(this.state)
    this.log(message)
    this.showTheoryToast(action)
  },

  showTheoryToast(action) {
    if (!wx.showModal) return
    const lang = this.state.lang || 'zh'
    wx.showModal({
      title: pick(text('新的理论', 'New Theory'), lang),
      content: theoryToastText(action, lang),
      showCancel: false,
      confirmText: pick(text('继续', 'Continue'), lang)
    })
  },

  newDay() {
    this.state.day += 1
    this.state.focus = MAX_FOCUS
    if (this.state.doubt > 0) this.state.insight += 1
    this.log(text(
      '你吹灭蜡烛又重新点亮。疑问还在，但纸上的线索变得更像路了。',
      'You blow out the candle and light it again. The doubts remain, but the marks on paper look more like a road.'
    ))
  },

  afterChange() {
    this.render()
    this.save()
  },

  getActions() {
    const s = this.state
    const lang = s.lang || 'zh'
    if (s.complete) return []
    const readyTheory = findReadyTheory(s)

    const chapterActions = ACTIONS
      .filter((action) => action.chapter === s.chapter)
      .filter((action) => action.type !== 'theory')
      .filter((action) => !action.visible || action.visible(s))
      .filter((action) => !action.once || !s.facts[action.id])
      .map((action) => ({
        id: action.id,
        label: pick(action.label, lang),
        hint: pick(action.hint, lang),
        kind: actionKind(action, lang),
        primary: action.type === 'theory',
        type: action.type,
        enabled: Boolean(canRun(s, action))
      }))

    const enabledExperiments = chapterActions.filter((action) => action.enabled && action.type === 'experiment')
    const enabledMisconceptions = chapterActions.filter((action) => action.enabled && action.type === 'misconception')
    const visible = []

    if (enabledExperiments[0]) visible.push(enabledExperiments[0])
    if (enabledMisconceptions[0]) visible.push(enabledMisconceptions[0])
    if (enabledExperiments[1]) visible.push(enabledExperiments[1])

    if (readyTheory || s.focus === 0 || visible.length < 3) {
      if (readyTheory || s.focus === 0) {
        if (readyTheory) {
          const theoryLabel = pick(readyTheory.label, lang)
          const theoryDef = THEORY_DEFS[readyTheory.id] || { zh: '', en: '' }
          visible.push({
            id: 'propose_theory',
            label: pick(theoryDef, lang),
            hint: pick(text('提出新概念', 'Propose New Concept'), lang),
            kind: pick(UI.kinds.theory, lang),
            primary: true,
            enabled: true
          })
        } else {
          if (!s._restOption) s._restOption = pickRestOption()
          visible.push({
            id: 'new_day',
            label: pick(s._restOption.label, lang),
            hint: pick(s._restOption.hint, lang),
            kind: pick(UI.kinds.rest, lang),
            primary: false,
            enabled: true
          })
        }
      } else {
        const slots = 3 - visible.length
        if (!s._restOptions) {
          s._restOptions = [...REST_OPTIONS].sort(() => Math.random() - 0.5).slice(0, slots)
        }
        s._restOptions.forEach((opt) => {
          visible.push({
            id: 'new_day',
            label: pick(opt.label, lang),
            hint: pick(opt.hint, lang),
            kind: pick(UI.kinds.rest, lang),
            primary: false,
            enabled: true
          })
        })
      }
    }

    return visible.slice(0, 3)
  },

  render() {
    const s = this.state
    const lang = s.lang || 'zh'
    const chapter = CHAPTERS[s.chapter]

    this.setData({
      lang,
      ui: {
        reset: pick(UI.reset, lang),
        resetChapter: pick(UI.resetChapter, lang),
        resetAll: pick(UI.resetAll, lang),
        lang: pick(UI.lang, lang),
        concepts: pick(UI.concepts, lang),
        log: pick(UI.log, lang)
      },
      title: s.complete ? pick(UI.completeTitle, lang) : pick(chapter.title, lang),
      scene: s.complete ? pick(UI.completeScene, lang) : pick(chapter.scene, lang),
      goal: s.complete ? pick(UI.completeGoal, lang) : pick(chapter.question, lang),
      phaseLabel: s.complete
        ? pick(UI.complete, lang)
        : lang === 'zh'
          ? `${pick(chapter.label, lang)} · ${s.day}${pick(UI.roundSuffix, lang)}`
          : `${pick(chapter.label, lang)} · ${pick(UI.day, lang)}${s.day}`,
      actions: this.getActions(),
      feedback: s.feedback ? pick(s.feedback, lang) : '',
      resources: [
        { key: 'focus', label: pick(UI.resources.focus, lang), value: s.focus, maxText: `/${MAX_FOCUS}` },
        { key: 'records', label: pick(UI.resources.records, lang), value: s.records, maxText: '' },
        { key: 'insight', label: pick(UI.resources.insight, lang), value: s.insight, maxText: '' },
        { key: 'predictions', label: pick(UI.resources.predictions, lang), value: s.predictions, maxText: '' },
        { key: 'doubt', label: pick(UI.resources.doubt, lang), value: s.doubt, maxText: '' }
      ],
      workers: this.getDiscoveries(),
      logs: s.logs.map((item, index) => ({
        key: `${item.time}-${index}`,
        time: item.time,
        text: pick(item.text, lang)
      }))
    })
  },

  getDiscoveries() {
    const lang = this.state.lang || 'zh'
    const facts = FACT_CONCEPTS
      .filter((fact) => this.state.facts[fact.key])
      .map((fact) => ({
        name: pick(fact.name, lang),
        task: pick(fact.task, lang)
      }))
    const laws = LAW_LIST
      .filter((law) => this.state.laws[law.key])
      .map((law) => ({
        name: pick(law.name, lang),
        task: pick(law.task, lang)
      }))
    return facts.concat(laws)
  },

  log(message) {
    const textValue = typeof message === 'string' ? text(message, message) : message
    const last = this.state.logs[0]
    if (last && pick(last.text, this.state.lang || 'zh') === pick(textValue, this.state.lang || 'zh')) return
    this.state.logs.unshift({ time: Date.now(), text: textValue })
    this.state.logs = this.state.logs.slice(0, 120)
  },

  save() {
    wx.setStorageSync(STORAGE_KEY, this.state)
  }
})


function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function renderDOM(data) {
  document.body.dataset.lang = data.lang || 'zh';
  const statusBar = document.getElementById('status-bar');
  statusBar.innerHTML = data.resources.map(item => `
    <div class="resource">
      <span class="resource-label">${escapeHtml(item.label)}</span>
      <span class="resource-value">${escapeHtml(item.value)}${escapeHtml(item.maxText)}</span>
    </div>
  `).join('');

  document.getElementById('phaseLabel').textContent = data.phaseLabel || '';
  document.getElementById('langBtn').textContent = data.ui.lang;
  document.getElementById('resetBtn').textContent = data.ui.reset;
  document.getElementById('title').textContent = data.title || '';
  document.getElementById('scene').textContent = data.scene || '';
  document.getElementById('goal').textContent = data.goal || '';

  const feedback = document.getElementById('feedback');
  feedback.textContent = data.feedback || '';
  feedback.hidden = !data.feedback;

  const actions = document.getElementById('actions');
  actions.innerHTML = data.actions.map(item => `
    <button class="action ${item.primary ? 'primary' : ''} ${item.enabled ? '' : 'is-disabled'}" ${item.enabled ? '' : 'disabled'} data-id="${escapeHtml(item.id)}">
      <span class="action-main">
        <span class="action-label">${escapeHtml(item.label)}</span>
        <span class="action-kind">${escapeHtml(item.kind)}</span>
      </span>
      ${item.hint ? `<span class="cost">${escapeHtml(item.hint)}</span>` : ''}
    </button>
  `).join('');

  document.getElementById('conceptTitle').textContent = data.ui.concepts;
  document.getElementById('logTitle').textContent = data.ui.log;

  const workersPanel = document.getElementById('workers-panel');
  const workers = document.getElementById('workers');
  workersPanel.hidden = !data.workers.length;
  workers.innerHTML = data.workers.map(item => `
    <div class="worker">
      <span>${escapeHtml(item.name)}</span>
      <span>${escapeHtml(item.task)}</span>
    </div>
  `).join('');

  const log = document.getElementById('log');
  log.innerHTML = data.logs.map(item => `<div class="log-line">${escapeHtml(item.text)}</div>`).join('');
}

function boot() {
  if (!miniProgramPage) throw new Error('Game page was not created.');
  const app = miniProgramPage;
  window.physicsDarkRoom = app;
  app.setData = function (nextData) {
    this.data = { ...(this.data || {}), ...nextData };
    renderDOM(this.data);
  };
  document.getElementById('langBtn').addEventListener('click', () => app.switchLanguage());
  document.getElementById('resetBtn').addEventListener('click', () => app.openResetMenu());
  document.getElementById('actions').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button || button.disabled) return;
    app.handleAction({ currentTarget: { dataset: { id: button.dataset.id } } });
  });
  window.addEventListener('beforeunload', () => app.onHide && app.onHide());
  app.onLoad();
}

document.addEventListener('DOMContentLoaded', boot);
