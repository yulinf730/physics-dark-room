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
      '你需要把太快的下落变成可观察的运动，再从记录里找出“保持原状”的想法。',
      'You need to slow the fall, make the motion measurable, and uncover the idea that objects tend to keep their state of motion.'
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
      '小车在桌上滑动。不同推力、不同质量，会让运动以不同方式改变。你还需要一种办法，抓住“正在变化”的那一瞬间。',
      'A cart slides across the table. Different pushes and different masses change motion in different ways. You still need a way to capture change at a single instant.'
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
      '两辆小车面对面。碰撞和拉扯会暴露一个事实：力总发生在两个物体之间。',
      'Two carts face each other. Collisions and pulls reveal a fact: forces always act between objects.'
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
      '星图被摊开。你要把地上的实验，拿去解释天上的弯曲。',
      'The star chart is unfolded. You must use experiments on Earth to explain the curve of a body in the sky.'
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
      '暗室里不再只有零散实验。定律、预言和证据开始互相咬合。',
      'The dark room no longer contains only scattered experiments. Laws, predictions, and evidence begin to lock together.'
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
      '桌上多了琥珀、毛皮和几片薄纸。力学刚刚让你相信接触和引力，现在另一种看不见的影响闯进暗室。',
      'Amber, fur, and paper scraps appear on the table. Mechanics taught you about contact and gravity; now another invisible influence enters the room.'
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
      '一节电池、一根导线、一枚磁针被摆在一起。你还不知道它们会不会彼此认出。',
      'A battery, a wire, and a compass needle are placed together. You do not yet know whether they will affect one another.'
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
      '线圈安静地躺着。磁铁靠近、远离，指针忽然动了一下，像暗室里的第二次心跳。',
      'The coil lies still. As the magnet moves in and out, the needle jumps like a second heartbeat in the dark room.'
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
      '纸上不再只有小车和轨道，而是布满看不见的线。电场、磁场和光，开始靠近同一张图。',
      'The page no longer shows only carts and orbits. It fills with invisible lines. Electric fields, magnetic fields, and light begin to belong to the same diagram.'
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
      '桌上多了线圈、铁芯、转轴和一截细灯丝。法拉第的影子在铜线里转动，爱迪生的灯泡还没有亮。',
      'Coils, an iron core, an axle, and a thin filament appear. Faraday turns inside the copper wire; Edison’s lamp has not yet lit.'
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
      '火花间隙啪地亮了一下。赫兹看到波，马可尼想把它送过海面。',
      'A spark gap snaps. Hertz sees the wave; Marconi wants to send it across the sea.'
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
      '水壶、活塞和飞轮挤进暗室。瓦特的机器喘着气，焦耳在旁边摇动桨叶。',
      'A kettle, a piston, and a flywheel crowd into the room. Watt’s engine breathes; nearby, Joule turns a paddle.'
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
      '卡诺画出循环，克劳修斯写下熵，玻尔兹曼把看不见的分子数成一片人群。',
      'Carnot draws a cycle, Clausius writes down entropy, and Boltzmann counts invisible molecules as a crowd of possibilities.'
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
      '音叉、玻璃罩和撒着细沙的金属板摆上桌面。空气忽然变得不再空。',
      'A tuning fork, a bell jar, and a sand-covered plate sit on the table. Suddenly, air no longer feels empty.'
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
      '棱镜把白光拆开，透镜把远处拉近，杨氏双缝在墙上留下明暗条纹。',
      'A prism splits white light, a lens forms images of distant things, and Young’s double slit leaves bright and dark bands on the wall.'
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
      '以太风没有吹动仪器。迈克耳孙和莫雷的干涉条纹安静得过分，爱因斯坦开始怀疑“同时”。',
      'The ether wind refuses to move the apparatus. Michelson and Morley’s fringes remain almost too quiet, and Einstein begins to question simultaneity.'
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
      '电梯在想象中下落。太阳旁边的星光微微偏折，旧的万有引力开始显出更深的轮廓。',
      'An elevator falls in a thought experiment. Starlight bends beside the Sun, and the old idea of gravity reveals a deeper outline.'
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
      '阴极射线在玻璃管里发光，金箔被 α 粒子轰击。汤姆孙、卢瑟福和密立根把原子拆出层次。',
      'Cathode rays glow inside a glass tube, and particles strike a sheet of gold foil. Thomson, Rutherford, and Millikan reveal layers inside the atom.'
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
      '黑体炉口发出颜色，金属板被光照后吐出电子。普朗克和爱因斯坦把能量切成一小包一小包。',
      'A blackbody furnace glows with color, and a metal plate spits out electrons when light falls on it. Planck and Einstein divide energy into packets.'
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
      '光谱线像原子的指纹。德布罗意给物质配上波，薛定谔写下方程，海森堡拿走了确定轨道。',
      'Spectral lines are atomic fingerprints. de Broglie gives matter a wavelength, Schrödinger writes an equation, and Heisenberg takes away exact orbits.'
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
      '云室里有细线划过。铀核裂开，链式反应在纸上扩散。反应堆和原子弹从同一个方程旁边站起来。',
      'Thin tracks cross a cloud chamber. Uranium splits, and a chain reaction spreads across the page. The reactor and the atomic bomb rise from beside the same equation.'
    )
  }
]

const ACTIONS = [
  {
    id: 'watch_apple',
    type: 'experiment',
    chapter: 0,
    label: text('观察苹果落下', 'Observe the Falling Apple'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.apple = true
      return text(
        '苹果落下，没有转弯，也没有犹豫。你在纸上写：它总是奔向地面。',
        'The apple falls without turning or hesitating. You write: it always moves toward the ground.'
      )
    }
  },
  {
    id: 'compare_objects',
    type: 'experiment',
    chapter: 0,
    label: text('比较石子和木块', 'Compare a Stone and a Wooden Block'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.manyFall = true
      return text(
        '石子、木块、苹果都往下走。原来不是苹果听话，是整个房间都偏向地面。',
        'A stone, a wooden block, and an apple all move downward. Apples are not special; the whole room seems tilted toward Earth.'
      )
    }
  },
  {
    id: 'build_slope',
    type: 'experiment',
    chapter: 0,
    label: text('搭斜面放慢运动', 'Build an Inclined Plane'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.manyFall,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.slope = true
      return text(
        '斜面把下落拖慢了。运动像被摊开的纸条，终于能一格一格数清。',
        'The inclined plane slows the fall down. Motion becomes a strip of paper you can count square by square.'
      )
    }
  },
  {
    id: 'wrong_weight',
    type: 'misconception',
    chapter: 0,
    label: text('断言重物更快', 'Claim Heavier Objects Fall Faster'),
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
        '你写下“重的更快”。纸面很安静，像是在等第二个物体来反驳。',
        'You write, "heavier means faster." The page stays quiet, as if waiting for another object to answer back.'
      )
    }
  },
  {
    id: 'wrong_direction_only',
    type: 'misconception',
    chapter: 0,
    label: text('只凭下落方向下结论', 'Judge from Direction Alone'),
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
        '你差点把“都向下”当成完整解释。可是方向只是线索，还不是定律。',
        'You almost treat "they all go down" as a full explanation. Direction is a clue, not a law.'
      )
    }
  },
  {
    id: 'law_inertia',
    type: 'theory',
    chapter: 0,
    label: text('提出牛顿第一定律', 'Discover Newton’s First Law of Motion'),
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
        '你写下第一条规则：没人打扰时，物体会坚持原来的样子。静止如此，匀速也如此。',
        'You discover the first law of motion: unless acted on by a net external force, an object remains at rest or continues moving with constant velocity in a straight line.'
      )
    }
  },
  {
    id: 'push_cart',
    type: 'experiment',
    chapter: 1,
    label: text('轻推小车', 'Nudge the Cart'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.push = true
      return text(
        '你轻推小车。它没有“想通”，只是被迫改变。力第一次露出手。',
        'You nudge the cart. It does not make a choice; it is forced to change. Force shows its hand for the first time.'
      )
    }
  },
  {
    id: 'wrong_push_forever',
    type: 'misconception',
    chapter: 1,
    label: text('认为必须一直推', 'Assume Motion Requires Continuous Pushing'),
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
        '你猜小车必须一直被推才会运动。可是它离手后还滑了一段，像是在反驳你。',
        'You guess the cart must be pushed continuously to move. But after your hand leaves, it still glides on, arguing back.'
      )
    }
  },
  {
    id: 'vary_force',
    type: 'experiment',
    chapter: 1,
    label: text('改变推力大小', 'Vary the Force'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.forceChange = true
      return text(
        '推得越狠，小车变速越快。你盯着那种“变快的快”，给它留了个位置。',
        'The harder the push, the faster the cart’s speed changes. You make room in your notes for acceleration.'
      )
    }
  },
  {
    id: 'add_mass',
    type: 'experiment',
    chapter: 1,
    label: text('给小车加重', 'Add Mass to the Cart'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.mass = true
      return text(
        '小车变重后开始固执。同样一推，它像在说：改变我，没那么容易。',
        'With more mass, the cart becomes stubborn. The same push now seems to say: changing me will not be so easy.'
      )
    }
  },
  {
    id: 'invent_calculus',
    type: 'experiment',
    chapter: 1,
    label: text('把时间切成薄片', 'Slice Time into Smaller Intervals'),
    hint: text('精力2 -> 思路1 预言1', 'Focus 2 -> Insight +1, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.forceChange && s.facts.mass,
    once: true,
    run(s) {
      s.insight += 1
      s.predictions += 1
      s.facts.calculus = true
      return text(
        '你把时间切成越来越薄的片。速度不再只是“前后差多少”，而成了每一瞬间的变化。',
        'You slice time into thinner and thinner moments. Speed is no longer just a before-and-after difference; it becomes change at an instant.'
      )
    }
  },
  {
    id: 'wrong_average_only',
    type: 'misconception',
    chapter: 1,
    label: text('只看平均速度', 'Use Only Average Velocity'),
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
        '你试着只用平均速度解释小车。纸上的曲线变得模糊，像被手掌抹过。',
        'You try to explain the cart using only average speed. The curve on the page blurs, as if wiped by a hand.'
      )
    }
  },
  {
    id: 'law_second',
    type: 'theory',
    chapter: 1,
    label: text('总结牛顿第二定律', 'Discover Newton’s Second Law of Motion'),
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
        '借着微积分，你抓住了每一瞬间的加速度。力、质量和变化被锁进一行：F = ma。',
        'With calculus, you describe acceleration at each instant. Net force, mass, and acceleration lock into one line: F = ma.'
      )
    }
  },
  {
    id: 'collide_carts',
    type: 'experiment',
    chapter: 2,
    label: text('碰撞两辆小车', 'Collide Two Carts'),
    hint: text('精力2 -> 记录2', 'Focus 2 -> Notes +2'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.facts.collision = true
      return text(
        '两辆小车撞在一起。一个被推出去，另一个也狼狈地退回。力没有独角戏。',
        'Two carts collide. One is pushed away; the other rolls back. Force is never a solo act.'
      )
    }
  },
  {
    id: 'wrong_one_way_force',
    type: 'misconception',
    chapter: 2,
    label: text('认定力是单向的', 'Treat Force as One-Sided'),
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
        '你把箭头只画向一边。小车退回来的痕迹提醒你：另一个箭头被你漏掉了。',
        'You draw the arrow only one way. The cart rolling back reminds you: you missed the other arrow.'
      )
    }
  },
  {
    id: 'pull_rope',
    type: 'experiment',
    chapter: 2,
    label: text('拉紧两端的绳', 'Pull Both Ends of a Rope'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.rope = true
      return text(
        '你拉绳，绳也拉你。你忽然觉得，世界从来不允许单方面动手。',
        'You pull the rope, and the rope pulls you back. The world does not allow one-sided action.'
      )
    }
  },
  {
    id: 'measure_pair_force',
    type: 'experiment',
    chapter: 2,
    label: text('比较两端读数', 'Compare the Two Readings'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.rope,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.equalPair = true
      return text(
        '你在绳子两端各接一个弹簧秤。两边读数一起抖动，最后停在同一个数上。',
        'You attach a spring scale to each end of the rope. Both readings tremble, then settle on the same number.'
      )
    }
  },
  {
    id: 'wrong_pair_not_equal',
    type: 'misconception',
    chapter: 2,
    label: text('认为反作用力较小', 'Assume the Reaction Is Weaker'),
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
        '你写下“反作用力也许小一些”。绳子绷得笔直，像在要求你量一量再说。',
        'You write, "maybe the reaction is weaker." The taut rope seems to demand a measurement.'
      )
    }
  },
  {
    id: 'law_third',
    type: 'theory',
    chapter: 2,
    label: text('总结牛顿第三定律', 'Discover Newton’s Third Law of Motion'),
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
        '你写下第三条规则：两个物体相互作用时，力大小相等、方向相反，分别作用在彼此身上。',
        'You discover the third law of motion: when two objects interact, they exert equal and opposite forces on each other.'
      )
    }
  },
  {
    id: 'read_moon',
    type: 'experiment',
    chapter: 3,
    label: text('查看月亮记录', 'Study the Moon’s Motion'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.moon = true
      return text(
        '月亮每晚都换一点方向，却始终不肯离开。它像一辆永远错过地面的车。',
        'Each night the Moon changes direction, yet it never escapes. It is like a cart that keeps missing the ground.'
      )
    }
  },
  {
    id: 'wrong_moon_free',
    type: 'misconception',
    chapter: 3,
    label: text('认为月亮没有下落', 'Assume the Moon Does Not Fall'),
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
        '你写下“月亮没有下落”。星图上的弯曲轨迹却轻轻敲了敲桌面。',
        'You write, "the Moon is not falling." The curved path on the star chart quietly taps the table.'
      )
    }
  },
  {
    id: 'estimate_curve',
    type: 'experiment',
    chapter: 3,
    label: text('估算月亮偏离', 'Estimate the Moon’s Curve'),
    hint: text('精力2 -> 预言1 思路1', 'Focus 2 -> Prediction +1, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.moon,
    once: true,
    run(s) {
      s.predictions += 1
      s.insight += 1
      s.facts.curve = true
      return text(
        '你画出月亮的弯路：它确实在下落，只是速度太横，总把地面错过去。',
        'You draw the Moon’s path: it is falling, but its sideways speed keeps making it miss Earth.'
      )
    }
  },
  {
    id: 'compare_earth_sky',
    type: 'experiment',
    chapter: 3,
    label: text('比较地面与天空', 'Compare Falling on Earth and in the Sky'),
    hint: text('精力2 -> 预言1 记录1', 'Focus 2 -> Prediction +1, Notes +1'),
    cost: 2,
    requires: (s) => s.facts.curve && s.laws.second,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.sameGravity = true
      return text(
        '苹果和月亮被放在同一张纸上。一个落到脚边，一个落成轨道。',
        'The apple and the Moon share one page. One falls to your feet; the other falls into orbit.'
      )
    }
  },
  {
    id: 'law_gravity',
    type: 'theory',
    chapter: 3,
    label: text('提出万有引力', 'Propose Universal Gravitation'),
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
        '你提出万有引力：同一种看不见的拉扯，拽住苹果，也拽住月亮。',
        'You propose universal gravitation: every mass attracts every other mass, including both the apple and the Moon.'
      )
    }
  },
  {
    id: 'write_principia',
    type: 'theory',
    chapter: 4,
    label: text('写成《自然哲学的数学原理》', 'Write the Principia'),
    hint: text('精力1 需：三定律 万有引力 记录2', 'Focus 1; requires: three laws, gravity, Notes 2'),
    cost: 1,
    requires: (s) => s.laws.inertia && s.laws.second && s.laws.third && s.laws.gravity && s.records >= 2,
    run(s) {
      s.records -= 2
      s.laws.principia = true
      s.chapter = 5
      s.feedback = null
      return text(
        '你合上《原理》。地上的碰撞、桌上的小车、天上的月亮，终于说起同一种语言。墙后，磁针轻轻偏了一下。',
        'You close the Principia. Collisions on the floor, carts on the table, and the Moon in the sky finally speak the same language. Behind the wall, a compass needle twitches.'
      )
    }
  },
  {
    id: 'rub_amber',
    type: 'experiment',
    chapter: 5,
    label: text('摩擦琥珀', 'Rub the Amber'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.amber = true
      return text(
        '琥珀擦过毛皮后，纸屑忽然竖起来，像听见了无声的召唤。',
        'After amber is rubbed with fur, paper scraps stand up as if hearing a silent call.'
      )
    }
  },
  {
    id: 'wrong_contact_only',
    type: 'misconception',
    chapter: 5,
    label: text('坚持必须接触才有力', 'Insist Forces Require Contact'),
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
        '你写下“必须接触”。纸屑在空中抖了一下，像在嘲笑这句话。',
        'You write, "contact is required." A paper scrap trembles in the air, as if laughing at the sentence.'
      )
    }
  },
  {
    id: 'compare_charges',
    type: 'experiment',
    chapter: 5,
    label: text('比较吸引和排斥', 'Compare Attraction and Repulsion'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.amber,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.chargePair = true
      return text(
        '有些东西靠近，有些东西躲开。电不只是“吸引”，它像有两种性格。',
        'Some things draw closer; others move away. Electricity is not just attraction; it seems to have two temperaments.'
      )
    }
  },
  {
    id: 'law_charge',
    type: 'theory',
    chapter: 5,
    label: text('定义电荷概念', 'Define Electric Charge'),
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
        '你给这种隔空的电性起了名字：电荷。同类相斥，异类相吸，暗室里多了一种看不见的秩序。',
        'You give this electric property a name: charge. Like repels like; unlike attracts unlike. Another invisible order enters the room.'
      )
    }
  },
  {
    id: 'close_circuit',
    type: 'experiment',
    chapter: 6,
    label: text('接通电池和导线', 'Connect the Battery and Wire'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.current = true
      return text(
        '导线接上电池，金属没有发光，却像有东西在里面流动。',
        'The wire is connected to the battery. The metal does not glow, yet something seems to flow inside it.'
      )
    }
  },
  {
    id: 'compass_near_wire',
    type: 'experiment',
    chapter: 6,
    label: text('把磁针靠近导线', 'Place a Compass beside the Wire'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.current,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.oersted = true
      return text(
        '电流经过时，磁针偏了一下。电和磁第一次在你面前互相点头。',
        'When current passes, the compass needle turns. Electricity and magnetism acknowledge each other for the first time.'
      )
    }
  },
  {
    id: 'wrong_electric_magnetic_separate',
    type: 'misconception',
    chapter: 6,
    label: text('认为电和磁无关', 'Treat Electricity and Magnetism as Separate'),
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
        '你把电和磁画在两页纸上。磁针还没上场，结论显得太整齐。',
        'You draw electricity and magnetism on two separate pages. The compass has not yet given its evidence.'
      )
    }
  },
  {
    id: 'law_current_magnetism',
    type: 'theory',
    chapter: 6,
    label: text('发现电流的磁效应', 'Discover the Magnetic Effect of Electric Current'),
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
        '你写下：电流会产生磁效应。导线周围不再是空的，而像有看不见的旋涡。',
        'You discover that an electric current produces a magnetic field. The space around the wire is no longer empty; it carries a circular magnetic pattern.'
      )
    }
  },
  {
    id: 'move_magnet_coil',
    type: 'experiment',
    chapter: 7,
    label: text('移动磁铁穿过线圈', 'Move a Magnet Through the Coil'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.induction = true
      return text(
        '磁铁一动，线圈里的指针也动。磁似乎能把电从静默里叫醒。',
        'When the magnet moves, the needle connected to the coil moves too. Magnetism seems able to wake electricity from silence.'
      )
    }
  },
  {
    id: 'wrong_static_magnet_current',
    type: 'misconception',
    chapter: 7,
    label: text('认为静止磁铁也能生电', 'Assume a Stationary Magnet Makes Current'),
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
        '你把磁铁停在线圈旁边，等电流自己出现。桌面安静得有点尴尬。',
        'You hold the magnet still beside the coil and wait for current. The table becomes awkwardly quiet.'
      )
    }
  },
  {
    id: 'reverse_motion',
    type: 'experiment',
    chapter: 7,
    label: text('反向移动磁铁', 'Reverse the Motion'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.induction,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.changeMatters = true
      return text(
        '磁铁反向移动，指针也反向偏转。线圈听见的不是“磁铁”，而是“变化”。',
        'Move the magnet the other way, and the needle turns the other way. The coil does not hear "magnet"; it hears "change."'
      )
    }
  },
  {
    id: 'law_induction',
    type: 'theory',
    chapter: 7,
    label: text('发现电磁感应', 'Discover Electromagnetic Induction'),
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
        '你写下：变化的磁场会生出电流。暗室里第一次出现了“变化产生变化”的味道。',
        'You discover electromagnetic induction: a changing magnetic flux can induce an emf and, in a closed circuit, a current.'
      )
    }
  },
  {
    id: 'draw_fields',
    type: 'experiment',
    chapter: 8,
    label: text('画出电场和磁场', 'Draw Electric and Magnetic Fields'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism && s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fields = true
      return text(
        '你不再只画物体，而开始画空间本身。线条穿过空处，像给看不见的东西铺路。',
        'You stop drawing only objects and begin drawing space itself. Lines cross empty regions like roads for the invisible.'
      )
    }
  },
  {
    id: 'wrong_light_separate',
    type: 'misconception',
    chapter: 8,
    label: text('认为光与电磁无关', 'Treat Light as Separate'),
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
        '你把光单独放到一边。纸上的速度数字却悄悄把它拉回电和磁旁边。',
        'You set light aside. The speed written on the page quietly pulls it back beside electricity and magnetism.'
      )
    }
  },
  {
    id: 'measure_wave_speed',
    type: 'experiment',
    chapter: 8,
    label: text('估算电磁波速度', 'Estimate the Electromagnetic Wave Speed'),
    hint: text('精力2 -> 预言2 思路1', 'Focus 2 -> Predictions +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.fields,
    once: true,
    run(s) {
      s.predictions += 2
      s.insight += 1
      s.facts.lightSpeed = true
      return text(
        '你算出场的波动速度。那个数字太熟悉了，像一道光从纸背后照出来。',
        'You calculate the speed of waves in the fields. The number is too familiar, like light shining from behind the page.'
      )
    }
  },
  {
    id: 'law_maxwell',
    type: 'theory',
    chapter: 8,
    label: text('写下麦克斯韦方程', 'Write Maxwell’s Equations'),
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
        '你写下麦克斯韦方程。电和磁互相追逐，自己向外传播；光，原来就是这种追逐的波。桌角的线圈忽然像一台机器。',
        'You write Maxwell’s equations. Changing electric and magnetic fields sustain one another and propagate outward; light is an electromagnetic wave. The coil on the table suddenly looks like a machine.'
      )
    }
  },
  {
    id: 'spin_motor',
    type: 'experiment',
    chapter: 9,
    label: text('让线圈转起来', 'Make the Coil Turn'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.motor = true
      return text(
        '通电线圈在磁场里转了半圈，又被换向器推着继续转。法拉第的小玩具露出电动机的骨架。',
        'A powered coil turns in a magnetic field, and a commutator pushes it onward. Faraday’s little toy reveals the skeleton of a motor.'
      )
    }
  },
  {
    id: 'wrong_power_free',
    type: 'misconception',
    chapter: 9,
    label: text('以为机器凭空出力', 'Assume Machines Create Energy'),
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
        '你差点把转动当成白来的礼物。电池发热的身体提醒你：账总要有人付。',
        'You almost treat rotation as a free gift. The warming battery reminds you that the bill is always paid somewhere.'
      )
    }
  },
  {
    id: 'turn_generator',
    type: 'experiment',
    chapter: 9,
    label: text('反过来转发电机', 'Turn a Generator'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.generator = true
      return text(
        '你用手转动线圈，电流表醒了。电动机倒过来，竟像发电机；运动和电开始互相兑换。',
        'You turn the coil by hand, and the galvanometer wakes. Run backward, a motor becomes a generator; motion and electricity begin to trade places.'
      )
    }
  },
  {
    id: 'light_filament',
    type: 'experiment',
    chapter: 9,
    label: text('点亮灯丝', 'Light a Filament'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.facts.generator,
    once: true,
    run(s) {
      s.records += 1
      s.facts.bulb = true
      return text(
        '细灯丝被电流烧得发白。斯旺和爱迪生都知道：要让城市亮起来，物理还得学会耐用。',
        'The thin filament glows white. Swan and Edison both know: to light a city, physics also has to learn durability.'
      )
    }
  },
  {
    id: 'law_electric_power',
    type: 'theory',
    chapter: 9,
    label: text('搭建电力系统', 'Build an Electric Power System'),
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
        '你把电动机、发电机和灯连成一条链：能量可以远距离分配，黑夜第一次显得可以被工程管理。',
        'You link motor, generator, and lamp into one chain: energy can be distributed across distance, and night begins to look like something engineering can manage.'
      )
    }
  },
  {
    id: 'spark_gap',
    type: 'experiment',
    chapter: 10,
    label: text('打出火花', 'Make a Spark'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.maxwell,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spark = true
      return text(
        '火花在间隙里啪地跳过。赫兹的装置很小，野心却很大：让麦克斯韦的波真的出现在桌上。',
        'A spark snaps across the gap. Hertz’s apparatus is small, but its ambition is large: make Maxwell’s waves appear on the table.'
      )
    }
  },
  {
    id: 'wrong_wire_needed',
    type: 'misconception',
    chapter: 10,
    label: text('认为信号必须走导线', 'Assume Signals Need Wires'),
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
        '你把消息困在铜线上。火花却像在敲墙，想把声音送到房间外。',
        'You trap the message in copper. The spark taps the wall, trying to send a voice outside the room.'
      )
    }
  },
  {
    id: 'build_antenna',
    type: 'experiment',
    chapter: 10,
    label: text('竖起天线', 'Raise an Antenna'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.spark,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.antenna = true
      return text(
        '天线把火花的急促变化抛进空间。看不见的波从导线边缘松手，向外跑去。',
        'The antenna throws the spark’s rapid changes into space. Invisible waves let go of the wire edge and run outward.'
      )
    }
  },
  {
    id: 'tune_receiver',
    type: 'experiment',
    chapter: 10,
    label: text('调谐接收器', 'Tune a Receiver'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.antenna,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.radio = true
      return text(
        '接收器只在某个频率上醒来。马可尼的无线电不是魔法，而是让远方的节奏被这里认出。',
        'The receiver wakes only at one frequency. Marconi’s radio is not magic; it lets a far rhythm be recognized here.'
      )
    }
  },
  {
    id: 'law_radio',
    type: 'theory',
    chapter: 10,
    label: text('实现无线通信', 'Establish Wireless Communication'),
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
        '你写下无线通信：把信息压进电磁波，再用调谐把它从空气里捞出来。暗室终于能听见远方。',
        'You establish wireless communication: encode information in electromagnetic waves, then recover it by tuning the receiver. The room can finally hear distant voices.'
      )
    }
  },
  {
    id: 'heat_water',
    type: 'experiment',
    chapter: 11,
    label: text('加热水壶', 'Heat the Kettle'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.steam = true
      return text(
        '水汽顶起壶盖。热没有画箭头，却实实在在把东西推开了。',
        'Steam lifts the lid. Heat draws no arrow on the page, yet it pushes something open.'
      )
    }
  },
  {
    id: 'wrong_caloric',
    type: 'misconception',
    chapter: 11,
    label: text('把热当成流体', 'Treat Heat as a Substance'),
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
        '你把热想成一种会流动的东西。水壶没有反对，但桨叶实验还没开始。',
        'You imagine heat as something that flows. The kettle does not object, but the paddle-wheel experiment has not begun.'
      )
    }
  },
  {
    id: 'turn_paddle',
    type: 'experiment',
    chapter: 11,
    label: text('转动焦耳桨叶', 'Turn Joule’s Paddle Wheel'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.steam,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.joule = true
      return text(
        '桨叶搅动水，温度慢慢升高。焦耳让机械功变成热，像把两本账合成一本。',
        'Paddles churn the water, and the temperature rises. Joule turns mechanical work into heat, merging two accounts into one.'
      )
    }
  },
  {
    id: 'build_heat_engine',
    type: 'experiment',
    chapter: 11,
    label: text('推动热机活塞', 'Drive a Heat Engine'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.joule,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.engine = true
      return text(
        '热的蒸汽推动活塞，活塞带动飞轮。瓦特的机器把矿井、工厂和城市接进同一个节拍。',
        'Hot steam drives a piston, and the piston turns a flywheel. Watt’s engine pulls mines, factories, and cities into one rhythm.'
      )
    }
  },
  {
    id: 'law_energy',
    type: 'theory',
    chapter: 11,
    label: text('总结能量守恒定律', 'Discover Conservation of Energy'),
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
        '你写下能量守恒：功、热、电和运动可以换装，但总账不会凭空增减。',
        'You discover conservation of energy: work, heat, electricity, and motion can transform into one another, but the total energy neither appears from nowhere nor vanishes.'
      )
    }
  },
  {
    id: 'watch_waste_heat',
    type: 'experiment',
    chapter: 12,
    label: text('比较废热', 'Compare Waste Heat'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.energy,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.wasteHeat = true
      return text(
        '热机做了功，也把大量热丢给冷端。能量没丢，可有些能量变得不再好用。',
        'The heat engine does work, yet dumps much heat to the cold side. Energy is not lost, but some of it becomes less useful.'
      )
    }
  },
  {
    id: 'wrong_perpetual_engine',
    type: 'misconception',
    chapter: 12,
    label: text('设计永动热机', 'Design a Perpetual Engine'),
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
        '你画出一台不浪费的热机。纸上很完美，现实里的冷端却不肯消失。',
        'You draw an engine with no waste. It is perfect on paper, but the cold side refuses to disappear.'
      )
    }
  },
  {
    id: 'trace_carnot_cycle',
    type: 'experiment',
    chapter: 12,
    label: text('描出卡诺循环', 'Trace the Carnot Cycle'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.wasteHeat,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.carnotCycle = true
      return text(
        '卡诺循环把热机拆成四段。效率不再只是工匠手艺，而成了温度之间的命运。',
        'Carnot cycle splits the engine into four stages. Efficiency is no longer just craftsmanship; it is a fate written between temperatures.'
      )
    }
  },
  {
    id: 'count_microstates',
    type: 'experiment',
    chapter: 12,
    label: text('数分子的排法', 'Count Molecular Arrangements'),
    hint: text('精力1 -> 思路1', 'Focus 1 -> Insight +1'),
    cost: 1,
    requires: (s) => s.facts.carnotCycle,
    once: true,
    run(s) {
      s.insight += 1
      s.facts.entropyClue = true
      return text(
        '玻尔兹曼把分子当成一大群可能的排法。混乱不是没规律，而是可能性太多。',
        'Boltzmann treats molecules as a crowd of possible arrangements. Disorder is not lawlessness; it is too many possibilities.'
      )
    }
  },
  {
    id: 'law_entropy',
    type: 'theory',
    chapter: 12,
    label: text('认识熵增方向', 'Discover the Entropy Principle'),
    hint: text('精力1 需：循环 分子排法 记录3 思路2 预言1', 'Focus 1; requires: cycle, microstates, Notes 3, Insight 2, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.entropyClue,
    requires: (s) => s.facts.carnotCycle && s.facts.entropyClue && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.entropy = true
      s.chapter = 13
      s.feedback = null
      return text(
        '你写下熵：能量仍守恒，但可用性会散开。时间的箭头第一次在暗室里有了刻度。',
        'You discover entropy: energy is conserved, but usable energy tends to spread out. The arrow of time gains its first markings in the dark room.'
      )
    }
  },
  {
    id: 'strike_tuning_fork',
    type: 'experiment',
    chapter: 13,
    label: text('敲响音叉', 'Strike a Tuning Fork'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.vibration = true
      return text(
        '音叉在手里发颤，声音却钻进耳朵。你开始怀疑：空气也许在跟着颤。',
        'The tuning fork trembles in your hand, yet the sound reaches your ear. You begin to suspect that air trembles too.'
      )
    }
  },
  {
    id: 'wrong_sound_material',
    type: 'misconception',
    chapter: 13,
    label: text('把声音当成物质飞出', 'Treat Sound as Stuff Flying Out'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.vibration && !s.facts.airWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：声音穿过空气，却不是把一团物质丢到耳朵里。抽走空气后，它会消失。',
        'Counterexample: sound crosses air, but it does not throw a lump of matter into the ear. Remove the air, and it disappears.'
      )
      return text(
        '你把声音想成细小的东西飞出去。音叉还在抖，像是在提示“传递”的不是物质本身。',
        'You imagine sound as tiny bits of stuff flying away. The fork keeps trembling, hinting that what travels is not matter itself.'
      )
    }
  },
  {
    id: 'bell_jar',
    type: 'experiment',
    chapter: 13,
    label: text('抽空玻璃罩', 'Pump Air Out of the Bell Jar'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.vibration,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.airWave = true
      return text(
        '玻璃罩里的铃还在动，声音却越来越薄。空气不是旁观者，它是声音的路。',
        'The bell still moves inside the jar, but the sound thins away. Air is not a bystander; it is the road sound travels on.'
      )
    }
  },
  {
    id: 'map_resonance',
    type: 'experiment',
    chapter: 13,
    label: text('寻找共振', 'Search for Resonance'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.airWave,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.resonance = true
      return text(
        '某个频率上，细沙跳出清楚的花纹。声音不是乱颤，而是有形状的波。',
        'At one frequency, sand jumps into a clear pattern. Sound is not random trembling; it is a shaped wave.'
      )
    }
  },
  {
    id: 'law_sound_wave',
    type: 'theory',
    chapter: 13,
    label: text('理解声波本质', 'Understand Sound as a Wave'),
    hint: text('精力1 需：空气 共振 记录3 思路1 预言1', 'Focus 1; requires: air, resonance, Notes 3, Insight 1, Prediction 1'),
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
        '你写下声波：介质来回振动，扰动向前传播。听见世界，原来是在读空气的波纹。',
        'You understand sound as a wave: particles of the medium vibrate back and forth while the disturbance travels onward. To hear the world is to read ripples in air.'
      )
    }
  },
  {
    id: 'pass_prism',
    type: 'experiment',
    chapter: 14,
    label: text('让白光穿过棱镜', 'Pass White Light through a Prism'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectrum = true
      return text(
        '白光被棱镜拆成彩色长带。牛顿把颜色从玻璃的魔术里救出来：颜色本来就在光里。',
        'White light splits into a colored band. Newton rescues color from the magic of glass: color was already in the light.'
      )
    }
  },
  {
    id: 'wrong_color_glass',
    type: 'misconception',
    chapter: 14,
    label: text('认为颜色由玻璃制造', 'Assume the Glass Creates Color'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum && !s.facts.interference,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：再用第二个棱镜可以把颜色合回白光。玻璃改变路径，却不是凭空制造颜色。',
        'Counterexample: a second prism can recombine colors into white. Glass changes paths; it does not create color from nothing.'
      )
      return text(
        '你把彩色归功于棱镜。光谱却整齐得像一份被拆开的名单。',
        'You credit the prism for the colors. The spectrum looks too orderly, like a list that has been unfolded.'
      )
    }
  },
  {
    id: 'focus_lens',
    type: 'experiment',
    chapter: 14,
    label: text('用透镜成像', 'Form an Image with a Lens'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.lens = true
      return text(
        '透镜把远处的烛火压到纸上。望远镜和显微镜从同一种折射里长出来。',
        'A lens forms an image of a distant candle on paper. The telescope and the microscope grow out of the same refraction.'
      )
    }
  },
  {
    id: 'make_interference',
    type: 'experiment',
    chapter: 14,
    label: text('做双缝干涉', 'Perform Double-Slit Interference'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.lens,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.interference = true
      return text(
        '两条缝在墙上织出明暗条纹。杨氏实验让光像波一样相加、相减。',
        'Two slits weave bright and dark bands on the wall. Young’s experiment shows light adding and canceling like waves.'
      )
    }
  },
  {
    id: 'law_optics',
    type: 'theory',
    chapter: 14,
    label: text('解释光的波动性', 'Establish Wave Optics'),
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
        '你写下波动光学：光会折射、成像、分色，也会干涉。它的路不是一条线，而是一整片波前。',
        'You establish wave optics: light refracts, forms images, disperses into colors, and interferes. Its behavior is not just a ray path, but a whole wavefront.'
      )
    }
  },
  {
    id: 'chase_light',
    type: 'experiment',
    chapter: 15,
    label: text('想象追逐光束', 'Imagine Chasing a Beam of Light'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.lightPuzzle = true
      return text(
        '你想象自己追上一束光。若真追上了，麦克斯韦的波会冻住吗？这个念头像一根刺。',
        'You imagine catching a beam of light. If you could, would Maxwell’s wave freeze? The thought is a splinter.'
      )
    }
  },
  {
    id: 'wrong_ether',
    type: 'misconception',
    chapter: 15,
    label: text('坚持存在以太风', 'Insist on an Ether Wind'),
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
        '你给光安排了一种介质。以太听上去体面，但它还需要留下可测的风。',
        'You assign a medium to light. Ether sounds respectable, but it must leave a measurable wind.'
      )
    }
  },
  {
    id: 'michelson_morley',
    type: 'experiment',
    chapter: 15,
    label: text('转动干涉仪', 'Rotate the Interferometer'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.lightPuzzle,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.michelsonMorley = true
      return text(
        '迈克耳孙和莫雷转动仪器，条纹几乎不动。以太风没有吹来，反而吹倒了旧直觉。',
        'Michelson and Morley rotate the apparatus, and the fringes barely move. No ether wind arrives; instead, an old intuition is blown over.'
      )
    }
  },
  {
    id: 'sync_clocks',
    type: 'experiment',
    chapter: 15,
    label: text('重新校准时钟', 'Synchronize the Clocks Again'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.michelsonMorley,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.clocks = true
      return text(
        '你用光信号校准远处时钟，发现“同时”不是宇宙免费赠送的标签，而是一种约定。',
        'You synchronize distant clocks with light signals and find that simultaneity is not a free label from the universe, but a convention.'
      )
    }
  },
  {
    id: 'law_special_relativity',
    type: 'theory',
    chapter: 15,
    label: text('建立狭义相对论', 'Establish Special Relativity'),
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
        '你写下狭义相对论：光速不让步，空间和时间只好一起调整。爱因斯坦把“现在”变成一道需要测量的问题。',
        'You establish special relativity: the speed of light is invariant, so space and time must adjust together. Einstein turns "now" into something that depends on how it is measured.'
      )
    }
  },
  {
    id: 'falling_elevator',
    type: 'experiment',
    chapter: 16,
    label: text('想象下落电梯', 'Imagine a Falling Elevator'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.specialRelativity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.elevator = true
      return text(
        '自由下落的电梯里，重力像暂时消失。爱因斯坦把这个想象实验攥得很紧。',
        'Inside a freely falling elevator, gravity seems to vanish for a moment. Einstein holds tightly to this thought experiment.'
      )
    }
  },
  {
    id: 'wrong_gravity_force_only',
    type: 'misconception',
    chapter: 16,
    label: text('只把引力当作普通力', 'Treat Gravity as Ordinary Force'),
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
        '你把引力画成一只手。电梯里的失重感却悄悄把那只手擦淡了。',
        'You draw gravity as a hand. The weightlessness in the elevator quietly fades that hand.'
      )
    }
  },
  {
    id: 'predict_light_bending',
    type: 'experiment',
    chapter: 16,
    label: text('预言星光偏折', 'Predict Starlight Bending'),
    hint: text('精力2 -> 记录1 预言2', 'Focus 2 -> Notes +1, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.elevator,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 2
      s.facts.curvedSpacetime = true
      return text(
        '如果时空会弯，光也该沿着弯路走。太阳边缘的星光成了给宇宙出的考题。',
        'If spacetime curves, light should follow the curve. Starlight beside the Sun becomes an exam question for the universe.'
      )
    }
  },
  {
    id: 'observe_eclipse',
    type: 'experiment',
    chapter: 16,
    label: text('观测日食星位', 'Observe Stars during an Eclipse'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.curvedSpacetime,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.eclipse = true
      return text(
        '日食时，星光位置偏了一点。爱丁顿的照片让时空弯曲第一次有了公众证词。',
        'During the eclipse, starlight shifts slightly. Eddington’s photographs give curved spacetime its first public witness.'
      )
    }
  },
  {
    id: 'law_general_relativity',
    type: 'theory',
    chapter: 16,
    label: text('建立广义相对论', 'Establish General Relativity'),
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
        '你写下广义相对论：物质告诉时空怎样弯曲，时空告诉物质怎样运动。引力变成了几何。',
        'You establish general relativity: matter tells spacetime how to curve, and spacetime tells matter how to move. Gravity becomes geometry.'
      )
    }
  },
  {
    id: 'cathode_ray',
    type: 'experiment',
    chapter: 17,
    label: text('偏转阴极射线', 'Deflect Cathode Rays'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.electron = true
      return text(
        '阴极射线被电场和磁场偏转。汤姆孙看见了电子：原子不再是最小的硬球。',
        'Cathode rays bend in electric and magnetic fields. Thomson sees the electron: the atom is no longer the smallest hard sphere.'
      )
    }
  },
  {
    id: 'wrong_solid_atom',
    type: 'misconception',
    chapter: 17,
    label: text('坚持原子是实心球', 'Insist Atoms Are Solid Balls'),
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
        '你把原子画成硬球。电子已经从里面跑出来，图却还假装完整。',
        'You draw the atom as a hard sphere. An electron has already escaped from inside, while the picture pretends to be whole.'
      )
    }
  },
  {
    id: 'gold_foil',
    type: 'experiment',
    chapter: 17,
    label: text('轰击金箔', 'Fire Alpha Particles at Gold Foil'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.electron,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.nucleus = true
      return text(
        '大多数粒子穿过去，少数却猛地弹回。卢瑟福像发现炮弹被薄纸反弹：原子中心有个很小很重的核。',
        'Most particles pass through, but a few rebound sharply. Rutherford sees cannonballs bounce from tissue paper: a tiny heavy nucleus sits at the center of the atom.'
      )
    }
  },
  {
    id: 'oil_drop',
    type: 'experiment',
    chapter: 17,
    label: text('测量油滴电荷', 'Measure the Charge on Oil Drops'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.nucleus,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.chargeQuantized = true
      return text(
        '密立根让油滴悬停，电荷总是一份一份出现。电不只是连续的雾，也有颗粒感。',
        'Millikan holds oil drops suspended, and charge appears in repeated units. Electricity is not merely a continuous mist; it has a grain to it.'
      )
    }
  },
  {
    id: 'law_atomic_structure',
    type: 'theory',
    chapter: 17,
    label: text('发现原子结构', 'Discover Atomic Structure'),
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
        '你写下原子结构：电子在外，原子核在内，电荷有最小单位。物质第一次被拆出内部地形。',
        'You discover atomic structure: electrons occupy the outside, a tiny massive nucleus sits within, and electric charge comes in discrete units. Matter gains internal geography.'
      )
    }
  },
  {
    id: 'blackbody',
    type: 'experiment',
    chapter: 18,
    label: text('记录黑体辐射', 'Record Blackbody Radiation'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.blackbody = true
      return text(
        '黑体炉口的颜色随温度改变，经典公式却在高频处崩坏。普朗克被迫把能量分成小份。',
        'The blackbody furnace changes color with temperature, while classical formulas fail at high frequency. Planck is forced to divide energy into packets.'
      )
    }
  },
  {
    id: 'wrong_continuous_energy',
    type: 'misconception',
    chapter: 18,
    label: text('坚持能量完全连续', 'Insist Energy Is Continuous'),
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
        '你把能量画成光滑斜坡。炉口的颜色却像一排台阶，不肯变得平滑。',
        'You draw energy as a smooth slope. The blackbody data refuses to fit that smooth picture.'
      )
    }
  },
  {
    id: 'photoelectric',
    type: 'experiment',
    chapter: 18,
    label: text('照射金属板', 'Shine Light on a Metal Plate'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.blackbody,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.photoelectric = true
      return text(
        '低频强光推不出电子，高频弱光却可以。爱因斯坦把光当成一粒粒能量包，门忽然开了。',
        'Bright low-frequency light cannot eject electrons, while weak high-frequency light can. Einstein treats light as packets of energy, and the explanation opens.'
      )
    }
  },
  {
    id: 'law_quanta',
    type: 'theory',
    chapter: 18,
    label: text('提出光量子', 'Discover Light Quanta'),
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
        '你写下光量子：光既能像波传播，也能像粒子交换能量。经典图像第一次裂出真正的缝。',
        'You discover light quanta: light can propagate like a wave while exchanging energy in particle-like packets. The classical picture cracks for real.'
      )
    }
  },
  {
    id: 'spectral_lines',
    type: 'experiment',
    chapter: 19,
    label: text('观察原子光谱', 'Observe Atomic Spectra'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectralLines = true
      return text(
        '氢原子的光不是连续彩虹，而是一条条固定谱线。原子像只会唱几个音的乐器。',
        'Hydrogen light is not a continuous rainbow, but fixed spectral lines. The atom sounds like an instrument with only certain notes.'
      )
    }
  },
  {
    id: 'wrong_planet_electron',
    type: 'misconception',
    chapter: 19,
    label: text('把电子当小行星', 'Treat Electrons as Tiny Planets'),
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
        '你把电子画成绕核小行星。图很好懂，可它解释不了原子为什么没有塌掉。',
        'You draw electrons as tiny planets around the nucleus. The picture is clear, but it cannot explain why atoms do not collapse.'
      )
    }
  },
  {
    id: 'matter_wave',
    type: 'experiment',
    chapter: 19,
    label: text('给电子配上波长', 'Assign a Wavelength to Electrons'),
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
        '德布罗意把波长交给电子。轨道不再是任意圆圈，而像只能容纳整圈波纹的弦。',
        'de Broglie assigns a wavelength to the electron. Allowed orbits stop being arbitrary circles and become standing-wave conditions.'
      )
    }
  },
  {
    id: 'uncertainty',
    type: 'experiment',
    chapter: 19,
    label: text('比较位置和动量', 'Compare Position and Momentum Precision'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.matterWave,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.uncertainty = true
      return text(
        '你越想钉死位置，动量越散开。海森堡不是说仪器太差，而是世界不给这两张精确收据。',
        'The more tightly you pin position, the more momentum spreads. Heisenberg is not blaming bad instruments; the world does not issue both exact receipts at once.'
      )
    }
  },
  {
    id: 'law_quantum_mechanics',
    type: 'theory',
    chapter: 19,
    label: text('建立量子力学', 'Establish Quantum Mechanics'),
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
        '你写下量子力学：薛定谔的波函数给出概率，海森堡的不确定性划出边界。原子世界不再像小机械表。',
        'You establish quantum mechanics: Schrödinger’s wave function gives probabilities, and Heisenberg’s uncertainty principle sets limits. The atomic world is no tiny clockwork mechanism.'
      )
    }
  },
  {
    id: 'cloud_chamber',
    type: 'experiment',
    chapter: 20,
    label: text('观察云室轨迹', 'Observe Cloud-Chamber Tracks'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.radioactivity = true
      return text(
        '云室里细线突然生长又消失。贝克勒尔和居里夫人打开的门，通向原子核深处。',
        'Thin lines suddenly grow and vanish in the cloud chamber. The door opened by Becquerel and Marie Curie leads deep into the nucleus.'
      )
    }
  },
  {
    id: 'wrong_atom_immutable',
    type: 'misconception',
    chapter: 20,
    label: text('认为原子核不可改变', 'Assume Nuclei Cannot Change'),
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
        '你把原子核当成最后的硬石头。云室轨迹却像石头里冒出的细烟。',
        'You treat the nucleus as the final hard stone. Cloud-chamber tracks rise from it like thin smoke.'
      )
    }
  },
  {
    id: 'split_uranium',
    type: 'experiment',
    chapter: 20,
    label: text('用中子敲开铀核', 'Split Uranium Nuclei with Neutrons'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.radioactivity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fission = true
      return text(
        '铀核裂成两块，并放出新的中子。哈恩看到结果，迈特纳给出解释：质量差变成了能量。',
        'Uranium splits into two pieces and releases new neutrons. Hahn sees the result, and Meitner explains it: missing mass becomes energy.'
      )
    }
  },
  {
    id: 'chain_reaction',
    type: 'experiment',
    chapter: 20,
    label: text('计算链式反应', 'Calculate a Chain Reaction'),
    hint: text('精力2 -> 记录2 预言2', 'Focus 2 -> Notes +2, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.fission,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 2
      s.facts.chainReaction = true
      return text(
        '一个中子引出更多中子，数字开始像火一样蔓延。费米的反应堆和原子弹站在同一条岔路口。',
        'One neutron leads to more neutrons, and the numbers spread like fire. Fermi’s reactor and the atomic bomb stand at the same fork.'
      )
    }
  },
  {
    id: 'law_nuclear_age',
    type: 'theory',
    chapter: 20,
    label: text('进入核时代', 'Enter the Nuclear Age'),
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
        '你写下核时代：同一套物理能点亮城市，也能毁掉城市。暗室最后没有给出按钮，只把责任交回你手里。',
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
    if (id === 'new_day') {
      const theory = findReadyTheory(this.state)
      if (theory) {
        this.discoverTheory(theory)
      } else {
        this.newDay()
      }
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
            id: 'new_day',
            label: theoryLabel,
            hint: pick(theoryDef, lang),
            kind: pick(UI.kinds.theory, lang),
            primary: true,
            enabled: true
          })
        } else {
          visible.push({
            id: 'new_day',
            label: pick(text('整理笔记', 'Organize Notes'), lang),
            hint: pick(text('恢复精力', 'Restore focus'), lang),
            kind: pick(UI.kinds.rest, lang),
            primary: false,
            enabled: true
          })
        }
      } else {
        const restOptions = [
          { label: text('静思冥想', 'Meditate'), hint: text('闭目沉思，理清思路', 'Close your eyes and think deeply') },
          { label: text('散步', 'Take a Walk'), hint: text('在花园中漫步，放松身心', 'Stroll through the garden') },
          { label: text('赏花', 'Enjoy Flowers'), hint: text('去公园赏花，感受自然之美', 'Visit the park and admire the flowers') },
          { label: text('与老友聊天', 'Chat with a Friend'), hint: text('与老友畅谈，交流想法', 'Have a conversation with an old friend') },
          { label: text('整理笔记', 'Organize Notes'), hint: text('回顾实验记录，整理思路', 'Review experiment notes') }
        ]
        const slots = 3 - visible.length
        const picked = restOptions.slice(0, slots)
        picked.forEach((opt) => {
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
