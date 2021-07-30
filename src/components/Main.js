import React, { useState } from 'react';

import { H5PContext } from '../context/H5PContext';
import Category from './category/Category';
import Uncategorized from './uncategorized/Uncategorized';
import CategoryList from './categoryList/CategoryList';
import TextItem from './textItem/TextItem';

import './Main.scss';
import deepCopy from '../helpers/deepCopy';

/**
 * A component that defines the top-level layout and
 * functionality.
 * @param {object} props Props object
 * @returns {JSX.Element} the main content to be displayed
 */
export default function Main({ context }) {
  const {
    randomizedTextItems,
    params: { textGroups }
  } = context;

  const [appliedCategoryAssignment, setAppliedCategoryAssignment] = useState([
    ...textGroups.map(() => []),
    randomizedTextItems.slice()
  ]);

  const [temporaryCategoryAssignment, setTemporaryCategoryAssignment] = useState([
    ...textGroups.map(() => []),
    randomizedTextItems.slice()
  ]);

  const uncategorizedId = textGroups.length;

  const applyCategoryAssignment = () => {
    // Remove text items that are to be moved from old categories
    appliedCategoryAssignment.forEach((category, categoryId) => {
      for (let otherCategoryId = category.length - 1; otherCategoryId >= 0; otherCategoryId--) {
        if (
          !temporaryCategoryAssignment[categoryId]
            .map((temporaryTextItem) => temporaryTextItem[0])
            .includes(category[otherCategoryId][0])
        ) {
          category.splice(otherCategoryId, 1);
        }
        else {
          category[otherCategoryId][2] = false; // Set boolean for moved to false for all text items
        }
      }
    });

    // Add back text items that are to be moved to new categories
    temporaryCategoryAssignment.forEach((category, categoryId) => {
      category.forEach((textItem) => {
        if (
          !appliedCategoryAssignment[categoryId]
            .map((appliedTextItem) => appliedTextItem[0])
            .includes(textItem[0])
        ) {
          appliedCategoryAssignment[categoryId].push(textItem);
          textItem[2] = true; // Set boolean for moved to true
        }
      });
    });

    setAppliedCategoryAssignment(deepCopy(appliedCategoryAssignment));
  };

  /**
   * Moves a text item from its current category to a new one
   * @param {String} textItemId
   * @param {String} categoryId
   */
  const moveTextItem = (textItemId, categoryId) => {
    const newCategories = temporaryCategoryAssignment.slice();
    let textItem;

    // Remove from previous category
    newCategories.forEach((category) => {
      category.forEach((item, index) => {
        if (item[0] === textItemId) {
          textItem = item;
          category.splice(index, 1);
        }
      });
    });

    // Add to new category
    newCategories[categoryId].push(textItem);
    setTemporaryCategoryAssignment(newCategories);
  };

  const removeAnimations = () => {
    const temporaryCategoryAssignmentCopy = deepCopy(temporaryCategoryAssignment);
    temporaryCategoryAssignmentCopy.flat().forEach((textItem) => {
      textItem[2] = false;
    });
    setTemporaryCategoryAssignment(temporaryCategoryAssignmentCopy);
    applyCategoryAssignment();
  };

  //Construct category elements
  const categoryElements = appliedCategoryAssignment.map((category, categoryId) => {
    if (categoryId < uncategorizedId) {
      return (
        <Category
          categoryId={categoryId}
          key={`category-${categoryId}`}
          title={textGroups[categoryId].groupName}
          assignTextItem={moveTextItem}
          applyCategoryAssignment={applyCategoryAssignment}
          appliedCategoryAssignment={appliedCategoryAssignment}
          temporaryCategoryAssignment={temporaryCategoryAssignment}
        >
          {category.map((textItem) => {
            const [textItemId, textItemElement, textItemShouldAnimate] = textItem;
            return (
              <TextItem
                key={textItemId}
                textItemId={textItemId}
                currentCategory={categoryId}
                categories={[...textGroups, { groupName: 'Uncategorized' }]}
                moveTextItem={moveTextItem}
                applyAssignment={applyCategoryAssignment}
                textElement={textItemElement}
                shouldAnimate={textItemShouldAnimate}
                removeAnimations={removeAnimations}
              />
            );
          })}
        </Category>
      );
    }
  });

  // Construct text item elements
  const textItemElements = appliedCategoryAssignment[uncategorizedId].map((textItem) => {
    const [textItemId, textItemElement, textItemShouldAnimate] = textItem;
    return (
      <TextItem
        key={textItemId}
        textItemId={textItemId}
        currentCategory={uncategorizedId}
        categories={textGroups}
        moveTextItem={moveTextItem}
        applyAssignment={applyCategoryAssignment}
        textElement={textItemElement}
        shouldAnimate={textItemShouldAnimate}
        removeAnimations={removeAnimations}
      />
    );
  });

  return (
    <H5PContext.Provider value={context}>
      <CategoryList>{categoryElements}</CategoryList>
      <Uncategorized>{textItemElements}</Uncategorized>
    </H5PContext.Provider>
  );
}
