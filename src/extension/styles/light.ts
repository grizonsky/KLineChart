/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type DeepPartial from '../../common/DeepPartial'
import type { Styles } from '../../common/Styles'

const light: DeepPartial<Styles> = {
  grid: {
    horizontal: {
      color: '#181818'
    },
    vertical: {
      color: '#181818'
    }
  },
  candle: {
    priceMark: {
      high: {
        color: '#76808F'
      },
      low: {
        color: '#76808F'
      }
    },
    tooltip: {
      rect: {
        color: '#FEFEFE',
        borderColor: '#F2F3F5'
      },
      title: {
        color: '#76808F'
      },
      legend: {
        color: '#76808F'
      }
    }
  },
  indicator: {
    tooltip: {
      title: {
        color: '#76808F'
      },
      legend: {
        color: '#76808F'
      }
    }
  },
  xAxis: {
    axisLine: {
      color: '#4a4a4a'
    },
    tickText: {
      color: '#76808F'
    },
    tickLine: {
      color: '#4a4a4a'
    }
  },
  yAxis: {
    axisLine: {
      color: '#4a4a4a'
    },
    tickText: {
      color: '#76808F'
    },
    tickLine: {
      color: '#4a4a4a'
    }
  },
  separator: {
    color: '#4a4a4a'
  },
  crosshair: {
    horizontal: {
      line: {
        color: '#4a4a4a'
      },
      text: {
        borderColor: '#4a4a4a',
        backgroundColor: '#4a4a4a'
      }
    },
    vertical: {
      line: {
        color: '#4a4a4a'
      },
      text: {
        borderColor: '#4a4a4a',
        backgroundColor: '#4a4a4a'
      }
    }
  }
}

export default light
