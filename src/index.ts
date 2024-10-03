export default function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirtyFlag = false;

  // Add pagingFunc function with explicit return type
  const pagingFunc = j.functionDeclaration(
    j.identifier('pagingFunc'),
    [
      j.identifier.from({
        name: 'date',
        typeAnnotation: j.tsTypeAnnotation(
          j.tsTypeReference(j.identifier('DateValue')),
        ),
      }),
      j.identifier.from({
        name: 'sign',
        typeAnnotation: j.tsTypeAnnotation(
          j.tsUnionType([
            j.tsLiteralType(j.numericLiteral(-1)),
            j.tsLiteralType(j.numericLiteral(1)),
          ]),
        ),
      }),
    ],
    j.blockStatement([
      j.ifStatement(
        j.binaryExpression(
          '===',
          j.identifier('sign'),
          j.numericLiteral(-1),
        ),
        j.blockStatement([
          j.returnStatement(
            j.callExpression(
              j.memberExpression(
                j.identifier('date'),
                j.identifier('minus'),
              ),
              [
                j.objectExpression([
                  j.property.from({
                    kind: 'init',
                    key: j.identifier('years'),
                    value: j.numericLiteral(1),
                  }),
                ]),
              ],
            ),
          ),
        ]),
      ),
      j.returnStatement(
        j.callExpression(
          j.memberExpression(
            j.identifier('date'),
            j.identifier('plus'),
          ),
          [
            j.objectExpression([
              j.property.from({
                kind: 'init',
                key: j.identifier('years'),
                value: j.numericLiteral(1),
              }),
            ]),
          ],
        ),
      ),
    ]),
  );

  // Ensure the function has a return type
  pagingFunc.returnType = j.tsTypeAnnotation(
    j.tsTypeReference(j.identifier('DateValue')),
  );

  // Insert function at the top of the file
  root.get().node.program.body.unshift(pagingFunc);
  dirtyFlag = true;

  // Transform <CalendarPrev step='year' /> and <CalendarNext step='year' />
  root.find(j.JSXElement).forEach((path) => {
    const openingElement = path.node.openingElement;
    if (j.JSXIdentifier.check(openingElement.name)) {
      if (openingElement.name.name === 'CalendarPrev') {
        openingElement.attributes = openingElement.attributes.map(
          (attr) => {
            if (
              j.JSXAttribute.check(attr) &&
              attr.name.name === 'step' &&
              attr.value.value === 'year'
            ) {
              return j.jsxAttribute(
                j.jsxIdentifier(':prev-page'),
                j.jsxExpressionContainer(
                  j.arrowFunctionExpression(
                    [
                      j.identifier.from({
                        name: 'date',
                        typeAnnotation: j.tsTypeAnnotation(
                          j.tsTypeReference(
                            j.identifier(
                              'DateValue',
                            ),
                          ),
                        ),
                      }),
                    ],
                    j.callExpression(
                      j.identifier('pagingFunc'),
                      [
                        j.identifier('date'),
                        j.numericLiteral(-1),
                      ],
                    ),
                  ),
                ),
              );
            }
            return attr;
          },
        );
        dirtyFlag = true;
      } else if (openingElement.name.name === 'CalendarNext') {
        openingElement.attributes = openingElement.attributes.map(
          (attr) => {
            if (
              j.JSXAttribute.check(attr) &&
              attr.name.name === 'step' &&
              attr.value.value === 'year'
            ) {
              return j.jsxAttribute(
                j.jsxIdentifier(':next-page'),
                j.jsxExpressionContainer(
                  j.arrowFunctionExpression(
                    [
                      j.identifier.from({
                        name: 'date',
                        typeAnnotation: j.tsTypeAnnotation(
                          j.tsTypeReference(
                            j.identifier(
                              'DateValue',
                            ),
                          ),
                        ),
                      }),
                    ],
                    j.callExpression(
                      j.identifier('pagingFunc'),
                      [
                        j.identifier('date'),
                        j.numericLiteral(1),
                      ],
                    ),
                  ),
                ),
              );
            }
            return attr;
          },
        );
        dirtyFlag = true;
      }
    }
  });

  return dirtyFlag ?
    root.toSource({ quote: 'single', trailingComma: true }) :
    undefined;
}

export const parser = 'tsx';